package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.exception.FileValidationException;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CycloneDxParsingService {

  @Inject
  ObjectMapper objectMapper;

  /**
   * Parses and validates CycloneDX JSON file from InputStream
   * @param fileInputStream InputStream containing the CycloneDX JSON file
   * @return ParsedCycloneDx containing the parsed JSON and extracted SBOM metadata
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

    // Extract SBOM metadata during parsing to avoid re-extraction
    String sbomName = extractSbomName(component);
    String sbomVersion = extractSbomVersion(component);
    String sbomDescription = extractSbomDescription(component);
    String sbomType = extractSbomType(component);
    String sbomPurl = extractSbomPurl(component);
    String bomRef = extractBomRef(component);

    return new ParsedCycloneDx(sbomJson, sbomName, sbomVersion, sbomDescription, sbomType, sbomPurl, bomRef);
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

  /**
   * Extracts the SBOM description from component.description
   * @param component Component node from metadata.component
   * @return SBOM description, or null if not present
   */
  private String extractSbomDescription(JsonNode component) {
    JsonNode componentDescription = component.get("description");
    if (Objects.isNull(componentDescription) || componentDescription.isNull()) {
      return null;
    }
    return componentDescription.asText();
  }

  /**
   * Extracts the SBOM type from component.type
   * @param component Component node from metadata.component
   * @return SBOM type, or null if not present
   */
  private String extractSbomType(JsonNode component) {
    JsonNode componentType = component.get("type");
    if (Objects.isNull(componentType) || componentType.isNull()) {
      return null;
    }
    return componentType.asText();
  }

  /**
   * Extracts the SBOM purl from component.purl
   * @param component Component node from metadata.component
   * @return SBOM purl, or null if not present
   */
  private String extractSbomPurl(JsonNode component) {
    JsonNode componentPurl = component.get("purl");
    if (Objects.isNull(componentPurl) || componentPurl.isNull()) {
      return null;
    }
    return componentPurl.asText();
  }

  /**
   * Extracts the BOM reference from component.bom-ref
   * @param component Component node from metadata.component
   * @return BOM reference, or null if not present
   */
  private String extractBomRef(JsonNode component) {
    JsonNode componentBomRef = component.get("bom-ref");
    if (Objects.isNull(componentBomRef) || componentBomRef.isNull()) {
      return null;
    }
    return componentBomRef.asText();
  }
}

