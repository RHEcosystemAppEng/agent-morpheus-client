package com.redhat.ecosystemappeng.morpheus.service;

import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.Product;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ProductProcessingService {

  private static final Logger LOGGER = Logger.getLogger(ProductProcessingService.class);
  
  private final ExecutorService executorService = Executors.newCachedThreadPool();

  @Inject
  SpdxParsingService spdxParsingService;

  @Inject
  ComponentProcessingService componentProcessingService;

  @Inject
  ProductService productService;

  @Inject
  ObjectMapper objectMapper;

  /**
   * Creates a new product from an SPDX SBOM file.
   * Parses the file, creates a product, saves it to the database,
   * and starts async processing.
   * 
   * @param fileInputStream The input stream containing the SPDX SBOM file
   * @param vulnerabilityId Required vulnerability ID to include in all component reports
   * @return The created product ID
   * @throws IllegalArgumentException if the file is null, invalid, missing required data, or vulnerabilityId is null/empty
   * @throws Exception if there's an error processing the file
   */
  public String createProductFromSpdx(InputStream fileInputStream, String vulnerabilityId) throws Exception {
    if (vulnerabilityId == null || vulnerabilityId.trim().isEmpty()) {
      throw new IllegalArgumentException("vulnerabilityId is required");
    }
    LOGGER.info("Creating new product from SPDX SBOM");
    
    if (fileInputStream == null) {
      throw new IllegalArgumentException("No file provided");
    }

    // Read file content
    String fileContent = new String(fileInputStream.readAllBytes());

    // Parse SPDX JSON
    JsonNode spdxJson = objectMapper.readTree(fileContent);
    
    // Parse SPDX to extract product info and components
    SpdxParsingService.ParsedSpdx parsed = spdxParsingService.parse(spdxJson);
    SpdxParsingService.ProductInfo productInfo = parsed.productInfo();
    
    // Generate product ID: name:version:timestamp (or name:timestamp if no version)
    String timestamp = Instant.now().toString().replace(":", "-").replace(".", "-");
    String productId = productInfo.version().isEmpty() 
        ? String.format("%s:%s", productInfo.name(), timestamp)
        : String.format("%s:%s:%s", productInfo.name(), productInfo.version(), timestamp);

    // Create product (status is computed from reports)
    String submittedAt = Instant.now().toString();
    Map<String, String> metadata = new HashMap<>();
    Product product = new Product(
        productId,
        productInfo.name(),
        productInfo.version(),
        submittedAt,
        parsed.components().size(),
        metadata,
        new ArrayList<>(),
        null
    );

    // Save product to database
    productService.save(product);

    // Start async processing
    processAsync(productId, spdxJson, vulnerabilityId);

    LOGGER.infof("Created product %s, started async processing", productId);
    
    return productId;
  }

  public void processAsync(String productId, JsonNode spdxJson, String vulnerabilityId) {
    CompletableFuture.runAsync(() -> {
      try {
        LOGGER.infof("Starting async processing for product: %s", productId);
        
        SpdxParsingService.ParsedSpdx parsed = spdxParsingService.parse(spdxJson);
        
        LOGGER.infof("Processing %d components for product: %s", parsed.components().size(), productId);
        
        // Build metadata for reports
        Map<String, String> metadata = new HashMap<>();
        metadata.put("product_id", productId);
        metadata.put("product_name", parsed.productInfo().name());
        if (parsed.productInfo().version() != null && !parsed.productInfo().version().isEmpty()) {
          metadata.put("product_version", parsed.productInfo().version());
        }
        
        // Process all components through the pipeline:
        // 1. Execute syft to get CycloneDX SBOM
        // 2. (Future) Call clair API for vulnerability scanning
        // 3. Call component syncer API
        // 4. Create report and add to queue
        componentProcessingService.processComponents(
            parsed.components(), 
            productId, 
            metadata,
            vulnerabilityId
        ); // Fire and forget - no waiting
      } catch (Exception e) {
        LOGGER.errorf(e, "Error during async processing for product: %s", productId);
      }
    }, executorService);
  }
}

