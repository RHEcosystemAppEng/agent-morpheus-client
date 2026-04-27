/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
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
  private static final int CYCLONEDX_COMPONENT_COUNT = 1;

  private CycloneDxParsingService cycloneDxParsingService;
  private ProductRepositoryService productRepository;
  private UserService userService;
  private ReportService reportService;
  private SpdxParsingService spdxParsingService;
  private ComponentProcessingService componentProcessingService;
  private CredentialProcessingService credentialProcessingService;
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
  public void setCredentialProcessingService(CredentialProcessingService credentialProcessingService) {
    this.credentialProcessingService = credentialProcessingService;
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
      throw new CveIdValidationException(null, "CVE ID is required");
    }

    if (!CVE_ID_PATTERN.matcher(cveId).matches()) {
      throw new CveIdValidationException(cveId, "Must match the official CVE pattern CVE-YYYY-NNNN+");
    }
  }

  /**
   * Generates a product ID from SBOM name and version.
   * For SPDX format: name-version-timestamp or name-timestamp if no version
   * 
   * @param name Product/SBOM name
   * @param version Product/SBOM version (can be null or empty)
   * @return Generated product ID
   */
  public String generateProductId(String name, String version) {
    String sanitizedName = name.replaceAll("[^a-zA-Z0-9_-]", "_");
    String timestamp = String.valueOf(Instant.now().toEpochMilli());
    if (version != null && !version.trim().isEmpty()) {
      String sanitizedVersion = version.replaceAll("[^a-zA-Z0-9_-]", "_");
      return sanitizedName + "-" + sanitizedVersion + "-" + timestamp;
    }
    return sanitizedName + "-" + timestamp;
  }

  /**
   * Processes a CycloneDX file upload: validates CVE ID, parses the file, saves and submits the report.
   * @param cveId CVE ID to analyze
   * @param fileInputStream InputStream containing the CycloneDX JSON file
   * @param credentialId optional credential ID to inject into the report before saving (null if not required)
   * @return saved ReportData including the database ID
   * @throws ValidationException if validation fails (contains field-specific error messages)
   * @throws IOException if file cannot be read
   */
  public ReportData submitCycloneDx(String cveId, InputStream fileInputStream, String credentialId) throws IOException {

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
    LOGGER.info("Processing CycloneDX file upload for CVE: " + cveId);
    Product product = this.createProduct(cveId, parsedCycloneDx.sbomName(), parsedCycloneDx.sbomVersion(), CYCLONEDX_COMPONENT_COUNT, new HashMap<>());
    ReportData reportData = reportService.createCycloneDxReportData(parsedCycloneDx, product.id(), cveId, false);

    if (Objects.nonNull(credentialId)) {
      credentialProcessingService.injectCredentialId(reportData.report(), credentialId);
    }

    ReportData savedReportData = reportService.saveReport(reportData);
    reportService.submit(savedReportData.reportRequestId().id(), savedReportData.report());
    return savedReportData;
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
        // Parse SPDX JSON
        spdxJson = objectMapper.readTree(fileInputStream);
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
    LOGGER.info("Processing SPDX file upload for CVE: " + cveId);
    
    SpdxParsingService.ProductInfo productInfo = parsed.productInfo();
    Map<String, String> metadata = new HashMap<>();    
    // Add CPE to metadata if present
    if (productInfo.cpe() != null && !productInfo.cpe().trim().isEmpty()) {
      metadata.put("cpe", productInfo.cpe());
    }
   
    if (Objects.nonNull(productInfo.spdxId())) {
      metadata.put(RepositoryConstants.SPDX_ID_METADATA_KEY, productInfo.spdxId());
    }

    int totalComponentCount = parsed.components().size() + parsed.unsupportedComponents().size();
    Product product = this.createProduct(cveId, productInfo.name(), productInfo.version(), totalComponentCount, metadata);

    for (SpdxParsingService.UnsupportedComponentInfo unsupported : parsed.unsupportedComponents()) {      
      String errorMessage = String.format(
          "Expects a container image purl with format pkg:oci/name@sha256:hash?repository_url=...&tag=...");
      String imageForDisplay = unsupported.purl() != null ? unsupported.purl() : "";
      productRepository.addSubmissionFailure(product.id(), new FailedComponent(
          unsupported.name(), unsupported.version(), imageForDisplay, errorMessage));
    }

    // Start component processing (chunks run in parallel on executor)
    processSpdxComponents(product.id(), parsed, cveId, credentialId);

    LOGGER.infof("Created product %s, started component processing", product.id());
    
    return product.id();
  }

  private void processSpdxComponents(String productId, SpdxParsingService.ParsedSpdx parsed, String vulnerabilityId, String credentialId) {
    try {
      LOGGER.infof("Processing %d components for product: %s", parsed.components().size(), productId);
      Map<String, String> componentMetadata = new HashMap<>();
      componentMetadata.put("product_id", productId);
      componentMetadata.put("product_name", parsed.productInfo().name());
      if (parsed.productInfo().version() != null && !parsed.productInfo().version().isEmpty()) {
        componentMetadata.put("product_version", parsed.productInfo().version());
      }
      componentProcessingService.processComponents(
          parsed.components(),
          productId,
          componentMetadata,
          vulnerabilityId,
          credentialId
      );
    } catch (Exception e) {
      LOGGER.errorf(e, "Error during component processing for product: %s", productId);
    }
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

