package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.redhat.ecosystemappeng.morpheus.exception.CveIdValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.FileValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.ValidationException;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequest;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CycloneDxUploadService {

  private static final Logger LOGGER = Logger.getLogger(CycloneDxUploadService.class);
  private static final Pattern CVE_ID_PATTERN = Pattern.compile("^CVE-[0-9]{4}-[0-9]{4,19}$");

  private CycloneDxParsingService cycloneDxParsingService;

  @Inject
  public void setCycloneDxParsingService(CycloneDxParsingService cycloneDxParsingService) {
    this.cycloneDxParsingService = cycloneDxParsingService;
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
   * Processes a CycloneDX file upload: validates CVE ID, parses the file, and creates a ReportRequest
   * @param cveId CVE ID to analyze
   * @param fileInputStream InputStream containing the CycloneDX JSON file
   * @return ReportRequest ready for processing
   * @throws ValidationException if validation fails (contains field-specific error messages)
   * @throws IOException if file cannot be read
   */
  public ReportRequest processUpload(String cveId, InputStream fileInputStream) throws IOException {
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
    } catch (FileValidationException e) {
      LOGGER.errorf("File validation failed: %s", e.getMessage());
      errors.put("file", e.getMessage());
    } catch (IOException e) {
      LOGGER.errorf("IO error while parsing file: %s", e.getMessage());
      errors.put("file", "Failed to read file: " + e.getMessage());
    }

    // If any validation errors occurred, throw ValidationException with all errors
    if (!errors.isEmpty()) {
      throw new ValidationException(errors);
    }

    // All validations passed, proceed with processing
    JsonNode sbomJson = parsedCycloneDx.sbomJson();
    String sbomName = parsedCycloneDx.sbomName();
    String sbomVersion = parsedCycloneDx.sbomVersion();
    String sbomDescription = parsedCycloneDx.sbomDescription();
    String sbomType = parsedCycloneDx.sbomType();
    String sbomPurl = parsedCycloneDx.sbomPurl();
    String bomRef = parsedCycloneDx.bomRef();

    // Generate SBOM report ID from SBOM name and timestamp
    String productId = generateSbomReportId(sbomName);

    // Create metadata with product_id, sbom_name, sbom_version, and additional SBOM metadata fields
    Map<String, String> metadata = new HashMap<>();
    metadata.put("product_id", productId);
    metadata.put("sbom_name", sbomName);
    if (Objects.nonNull(sbomVersion)) {
      metadata.put("sbom_version", sbomVersion);
    }
    if (Objects.nonNull(sbomDescription)) {
      metadata.put("sbom_description", sbomDescription);
    }
    if (Objects.nonNull(sbomType)) {
      metadata.put("sbom_type", sbomType);
    }
    if (Objects.nonNull(sbomPurl)) {
      metadata.put("sbom_purl", sbomPurl);
    }
    if (Objects.nonNull(bomRef)) {
      metadata.put("sbom_bom_ref", bomRef);
    }

    // Create and return ReportRequest
    return createReportRequest(cveId, sbomJson, metadata);
  }

  /**
   * Generates an SBOM report ID by combining the SBOM name with a timestamp
   * @param sbomName SBOM name from metadata.component.name
   * @return Generated SBOM report ID
   */
  private String generateSbomReportId(String sbomName) {
    String timestamp = String.valueOf(Instant.now().toEpochMilli());
    // Sanitize sbomName to make it safe for use in SBOM report ID (remove special chars, spaces)
    String sanitizedSbomName = sbomName.replaceAll("[^a-zA-Z0-9_-]", "_");
    return sanitizedSbomName + "-" + timestamp;
  }

  /**
   * Creates a ReportRequest from CVE ID and parsed CycloneDX JSON
   * @param cveId Validated CVE ID
   * @param sbomJson Parsed and validated CycloneDX JSON
   * @param metadata Metadata map containing product_id and sbom_name
   * @return ReportRequest ready for processing
   */
  private ReportRequest createReportRequest(String cveId, JsonNode sbomJson, Map<String, String> metadata) {
    return new ReportRequest(
      null, // id - auto-generated
      "image", // analysisType
      java.util.Collections.singletonList(cveId), // vulnerabilities
      null, // image
      sbomJson, // sbom
      com.redhat.ecosystemappeng.morpheus.model.morpheus.SbomInfoType.MANUAL, // sbomInfoType
      metadata, // metadata with product_id and sbom_name
      null, // sourceRepo
      null, // commitId
      null, // ecosystem
      null // manifestPath
    );
  }
}


