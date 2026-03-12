package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.exception.CveIdValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.ValidationException;
import com.redhat.ecosystemappeng.morpheus.model.FailedComponent;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;
import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SbomReportService {

  private static final Logger LOGGER = Logger.getLogger(SbomReportService.class);
  private static final Pattern CVE_ID_PATTERN = Pattern.compile("^CVE-[0-9]{4}-[0-9]{4,19}$");
  private final ExecutorService executorService = Executors.newCachedThreadPool();

  private CycloneDxParsingService cycloneDxParsingService;
  private ProductRepositoryService productRepository;
  private UserService userService;
  private ReportService reportService;
  private SpdxParsingService spdxParsingService;
  private ComponentProcessingService componentProcessingService;
  private ObjectMapper objectMapper;

  @Inject
  public void setCycloneDxParsingService(CycloneDxParsingService cycloneDxParsingService) {
    this.cycloneDxParsingService = cycloneDxParsingService;
  }

  @Inject
  public void setProductRepositoryService(ProductRepositoryService productRepository) {
    this.productRepository = productRepository;
  }

  @Inject
  public void setUserService(UserService userService) {
    this.userService = userService;
  }

  @Inject
  public void setReportService(ReportService reportService) {
    this.reportService = reportService;
  }

  @Inject
  public void setSpdxParsingService(SpdxParsingService spdxParsingService) {
    this.spdxParsingService = spdxParsingService;
  }

  @Inject
  public void setComponentProcessingService(ComponentProcessingService componentProcessingService) {
    this.componentProcessingService = componentProcessingService;
  }

  @Inject
  public void setObjectMapper(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  /**
   * Validates CVE ID format
   * @param cveId CVE ID to validate
   * @throws CveIdValidationException if CVE ID is null, empty, or doesn't match the required pattern
   */
  public void validateCveId(String cveId) {
    if (Objects.isNull(cveId) || cveId.trim().isEmpty()) {
      throw new CveIdValidationException("CVE ID is required");
    }

    if (!CVE_ID_PATTERN.matcher(cveId).matches()) {
      throw new CveIdValidationException("CVE ID format is invalid. Must match the official CVE pattern CVE-YYYY-NNNN+");
    }
  }

  /**
   * Generates a product ID from SBOM name and version.
   * For SPDX format: name:version:timestamp or name:timestamp if no version
   * For CycloneDX format: sanitized-name-timestamp
   * 
   * @param name Product/SBOM name
   * @param version Product/SBOM version (can be null or empty)
   * @param format Format type: "spdx" or "cyclonedx"
   * @return Generated product ID
   */
  public String generateProductId(String name, String version) {          
    String sanitizedName = name.replaceAll("[^a-zA-Z0-9_-]", "_");
    return sanitizedName + "-" + String.valueOf(Instant.now().toEpochMilli());
    
  }

  /**
   * Processes a CycloneDX file upload: validates CVE ID, parses the file, and creates a ReportRequest
   * @param cveId CVE ID to analyze
   * @param fileInputStream InputStream containing the CycloneDX JSON file
   * @return ReportRequest ready for processing
   * @throws ValidationException if validation fails (contains field-specific error messages)
   * @throws IOException if file cannot be read
   */
  public ReportData submitCycloneDx(String cveId, InputStream fileInputStream) throws IOException {
    LOGGER.info("Processing CycloneDX file upload for CVE: " + cveId);

    Map<String, String> errors = new HashMap<>();

    // Validate CVE ID and collect errors
    try {
      validateCveId(cveId);
    } catch (CveIdValidationException e) {
      errors.put("cveId", e.getMessage());
    }

    // Parse and validate CycloneDX file and collect errors
    ParsedCycloneDx parsedCycloneDx = null;
    try {
      parsedCycloneDx = cycloneDxParsingService.parseCycloneDxFile(fileInputStream);
    } catch (SbomValidationException e) {
      LOGGER.errorf("SBOM validation failed: %s", e.getMessage());
      errors.put("file", e.getMessage());
    } catch (IOException e) {
      LOGGER.errorf("IO error while parsing file: %s", e.getMessage());
      errors.put("file", "Failed to read file: " + e.getMessage());
    }

    // If any validation errors occurred, throw ValidationException with all errors
    if (!errors.isEmpty()) {
      throw new ValidationException(errors);
    }
    
    Product product = this.createProduct(cveId, parsedCycloneDx.sbomName(), parsedCycloneDx.sbomVersion(), 1, new HashMap<>());
    ReportData reportData = this.reportService.submitCycloneDx(parsedCycloneDx, product.id(), cveId);    
    return reportData;
  }

  /**
   * Creates a new product from an SPDX SBOM file.
   * Parses the file, validates CVE ID, creates a product, saves it to the database,
   * and starts async processing.
   * 
   * @param fileInputStream The input stream containing the SPDX SBOM file
   * @param cveId Required vulnerability ID to include in all component reports
   * @return The created product ID
   * @throws ValidationException if validation fails (contains field-specific error messages)
   * @throws IOException if file cannot be read
   */
  public String submitSpdx(InputStream fileInputStream, String cveId, String credentialId) throws IOException {
    LOGGER.info("Processing SPDX file upload for CVE: " + cveId);

    Map<String, String> errors = new HashMap<>();

    // Validate CVE ID and collect errors
    try {
      validateCveId(cveId);
    } catch (CveIdValidationException e) {
      errors.put("cveId", e.getMessage());
    }

    // Validate file input
    if (fileInputStream == null) {
      errors.put("file", "No file provided");
    }

    // Parse and validate SPDX file and collect errors
    JsonNode spdxJson = null;
    SpdxParsingService.ParsedSpdx parsed = null;
    if (fileInputStream != null) {
      try {
        // Read file content
        String fileContent = new String(fileInputStream.readAllBytes());
        // Parse SPDX JSON
        spdxJson = objectMapper.readTree(fileContent);
        // Parse SPDX to extract product info and components
        parsed = spdxParsingService.parse(spdxJson);
      } catch (SbomValidationException e) {
        LOGGER.errorf("SBOM validation failed: %s", e.getMessage());
        errors.put("file", e.getMessage());
      } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
        LOGGER.errorf("JSON parsing failed: %s", e.getMessage());
        errors.put("file", "File is not valid JSON: " + e.getMessage());
      } catch (IOException e) {
        LOGGER.errorf("IO error while parsing file: %s", e.getMessage());
        errors.put("file", "Failed to read file: " + e.getMessage());
      } catch (Exception e) {
        LOGGER.errorf("Error parsing SPDX file: %s", e.getMessage());
        errors.put("file", "Failed to parse SPDX file: " + e.getMessage());
      }
    }

    // If any validation errors occurred, throw ValidationException with all errors
    if (!errors.isEmpty()) {
      throw new ValidationException(errors);
    }

    SpdxParsingService.ProductInfo productInfo = parsed.productInfo();
    Map<String, String> metadata = new HashMap<>();
    
    // Add CPE to metadata if present
    if (productInfo.cpe() != null && !productInfo.cpe().trim().isEmpty()) {
      metadata.put("cpe", productInfo.cpe());
    }
   
    if (Objects.nonNull(productInfo.spdxId())) {
      metadata.put("spdx_id", productInfo.spdxId());
    }

    int totalComponentCount = parsed.components().size() + parsed.unsupportedComponents().size();
    Product product = this.createProduct(cveId, productInfo.name(), productInfo.version(), totalComponentCount, metadata);

    for (SpdxParsingService.UnsupportedComponentInfo unsupported : parsed.unsupportedComponents()) {      
      String errorMessage = String.format(
          "Unsupported component. Expects a container image package URL starting with pkg:oci");
      String imageForDisplay = unsupported.purl() != null ? unsupported.purl() : "";
      productRepository.addSubmissionFailure(product.id(), new FailedComponent(
          unsupported.name(), unsupported.version(), imageForDisplay, errorMessage));
    }

    // Start async processing with credentialId (supported components only)
    processSpdxAsync(product.id(), parsed, cveId, credentialId);

    LOGGER.infof("Created product %s, started async processing", product.id());
    
    return product.id();
  }

  public void processSpdxAsync(String productId, SpdxParsingService.ParsedSpdx parsed, String vulnerabilityId, String credentialId) {
    CompletableFuture.runAsync(() -> {
      try {        
                
        LOGGER.infof("Processing async for %d components for product: %s", parsed.components().size(), productId);        
        // Build metadata for reports
        Map<String, String> componentMetadata = new HashMap<>();
        componentMetadata.put("product_id", productId);
        componentMetadata.put("product_name", parsed.productInfo().name());
        if (parsed.productInfo().version() != null && !parsed.productInfo().version().isEmpty()) {
          componentMetadata.put("product_version", parsed.productInfo().version());
        }
        
        // Process all components through the pipeline:
        // 1. Execute syft to get CycloneDX SBOM
        // 2. (Future) Call clair API for vulnerability scanning
        // 3. Call component syncer API
        // 4. Create report and add to queue
        componentProcessingService.processComponents(
            parsed.components(), 
            productId,
            componentMetadata,
            vulnerabilityId,
            credentialId
        ); // Fire and forget - no waiting
      } catch (Exception e) {
        LOGGER.errorf(e, "Error during async processing for product: %s", productId);
      }
    }, executorService);
  }

  private Product createProduct(String cveId, String sbomName, String sbomVersion, int componentCount, Map<String, String> metadata) {    
    String productId = generateProductId(sbomName, sbomVersion);
    Product product = new Product(
      productId,
      sbomName,
      Objects.nonNull(sbomVersion) ? sbomVersion : "",
      Instant.now().toString(),
      componentCount,
      metadata,
      Collections.emptyList(),
      cveId
    );
    productRepository.save(product, userService.getUserName());    
    return product;
  }
}

