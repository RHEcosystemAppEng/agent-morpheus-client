package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CycloneDxParsingService {

  @Inject
  ObjectMapper objectMapper;

  /**
   * Parses and validates CycloneDX JSON file from InputStream
   * @param fileInputStream InputStream containing the CycloneDX JSON file
   * @return ParsedCycloneDx containing the parsed JSON and extracted SBOM name and version
   * @throws FileValidationException if file is null, not valid JSON, or missing required fields
   * @throws IOException if file cannot be read
   */
  public ParsedCycloneDx parseCycloneDxFile(InputStream fileInputStream) throws IOException {
    if (Objects.isNull(fileInputStream)) {
      throw new FileValidationException("File is required");
    }

    JsonNode sbomJson;
    try {
      sbomJson = objectMapper.readTree(fileInputStream);
    } catch (JsonProcessingException e) {
      throw new FileValidationException("File is not valid JSON: " + e.getMessage(), e);
    }

    // Get component once to avoid duplication
    JsonNode component = getComponent(sbomJson);
    validateCycloneDxStructure(component);

    // Extract SBOM name and version during parsing to avoid re-extraction
    String sbomName = extractSbomName(component);
    String sbomVersion = extractSbomVersion(component);

    return new ParsedCycloneDx(sbomJson, sbomName, sbomVersion);
  }

  /**
   * Gets the component from metadata.component in the CycloneDX JSON
   * @param sbomJson Parsed CycloneDX JSON
   * @return Component node
   * @throws FileValidationException if metadata or component is missing
   */
  private JsonNode getComponent(JsonNode sbomJson) {
    JsonNode metadata = sbomJson.get("metadata");
    if (Objects.isNull(metadata)) {
      throw new FileValidationException("SBOM is missing required field: metadata");
    }

    JsonNode component = metadata.get("component");
    if (Objects.isNull(component)) {
      throw new FileValidationException("SBOM is missing required field: metadata.component");
    }

    return component;
  }

  /**
   * Validates that the CycloneDX component contains the required name field
   * @param component Component node from metadata.component
   * @throws FileValidationException if required fields are missing
   */
  private void validateCycloneDxStructure(JsonNode component) {
    JsonNode componentName = component.get("name");
    if (Objects.isNull(componentName) || componentName.asText().trim().isEmpty()) {
      throw new FileValidationException("SBOM is missing required field: metadata.component.name");
    }
  }

  /**
   * Extracts the SBOM name from component.name
   * @param component Component node from metadata.component
   * @return SBOM name
   */
  private String extractSbomName(JsonNode component) {
    JsonNode componentName = component.get("name");
    return componentName.asText();
  }

  /**
   * Extracts the SBOM version from component.version
   * @param component Component node from metadata.component
   * @return SBOM version, or null if not present
   */
  private String extractSbomVersion(JsonNode component) {
    JsonNode componentVersion = component.get("version");
    if (Objects.isNull(componentVersion) || componentVersion.isNull()) {
      return null;
    }
    return componentVersion.asText();
  }
}

