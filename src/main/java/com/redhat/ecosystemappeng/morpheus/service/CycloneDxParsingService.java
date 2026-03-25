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
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CycloneDxParsingService {

  /** Syft convention: when {@code name} equals this property's value, the component is the Go main module. */
  public static final String SYFT_METADATA_MAIN_MODULE = "syft:metadata:mainModule";

  @Inject
  ObjectMapper objectMapper;

  /**
   * Strips a trailing {@code ?query} suffix from a PURL (or any warning key string) so CycloneDX {@code purl}
   * values (e.g. with {@code ?package-id=}) match Exhort {@code status.warnings} object keys.
   */
  public static String basePurlForExhortWarningMatch(String purlOrKey) {
    if (purlOrKey == null) {
      return "";
    }
    int q = purlOrKey.indexOf('?');
    return q < 0 ? purlOrKey : purlOrKey.substring(0, q);
  }

  /**
   * Collects normalized base PURLs for CycloneDX {@code components} that represent the Syft-encoded main module:
   * {@code syft:metadata:mainModule} property value {@code V} and {@code component.name == V}.
   *
   * @param cyclonedxRoot parsed CycloneDX document root (JSON object)
   * @return distinct base PURLs (query stripped); empty if {@code components} is missing or not an array
   */
  public Set<String> collectSyftMainModuleBasePurls(JsonNode cyclonedxRoot) {
    if (cyclonedxRoot == null || !cyclonedxRoot.isObject()) {
      throw new SbomValidationException("CycloneDX root is not a JSON object; cannot verify dependency CVE data");
    }
    JsonNode components = cyclonedxRoot.get("components");
    if (components == null || !components.isArray()) {
      return Set.of();
    }
    Set<String> bases = new LinkedHashSet<>();
    for (JsonNode c : components) {
      if (c == null || !c.isObject()) {
        continue;
      }
      JsonNode purlNode = c.get("purl");
      if (purlNode == null || !purlNode.isTextual()) {
        continue;
      }
      String purl = purlNode.asText("");
      if (purl.isBlank()) {
        continue;
      }
      String mainModule = syftMainModuleFromProperties(c.get("properties"));
      if (mainModule == null || mainModule.isBlank()) {
        continue;
      }
      JsonNode nameNode = c.get("name");
      if (nameNode == null || !nameNode.isTextual()) {
        continue;
      }
      if (!mainModule.equals(nameNode.asText())) {
        continue;
      }
      bases.add(basePurlForExhortWarningMatch(purl));
    }
    return bases;
  }

  private static String syftMainModuleFromProperties(JsonNode properties) {
    if (properties == null || !properties.isArray()) {
      return null;
    }
    for (JsonNode p : properties) {
      if (p != null && p.isObject() && SYFT_METADATA_MAIN_MODULE.equals(p.path("name").asText())) {
        String v = p.path("value").asText("");
        return v.isBlank() ? null : v;
      }
    }
    return null;
  }

  /**
   * Parses and validates CycloneDX JSON file from InputStream
   * @param fileInputStream InputStream containing the CycloneDX JSON file
   * @return ParsedCycloneDx containing the parsed JSON and extracted SBOM metadata
   * @throws SbomValidationException if file is null, not valid JSON, or missing required fields
   * @throws IOException if file cannot be read
   */
  public ParsedCycloneDx parseCycloneDxFile(InputStream fileInputStream) throws IOException {
    if (Objects.isNull(fileInputStream)) {
      throw new SbomValidationException("File is required");
    }

    JsonNode sbomJson;
    try {
      sbomJson = objectMapper.readTree(fileInputStream);
    } catch (JsonProcessingException e) {
      throw new SbomValidationException("File is not valid JSON: " + e.getMessage(), e);
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
   * @throws SbomValidationException if metadata or component is missing
   */
  private JsonNode getComponent(JsonNode sbomJson) {
    JsonNode metadata = sbomJson.get("metadata");
    if (Objects.isNull(metadata)) {
      throw new SbomValidationException("SBOM is missing required field: metadata");
    }

    JsonNode component = metadata.get("component");
    if (Objects.isNull(component)) {
      throw new SbomValidationException("SBOM is missing required field: metadata.component");
    }

    return component;
  }

  /**
   * Validates that the CycloneDX component contains the required name field
   * @param component Component node from metadata.component
   * @throws SbomValidationException if required fields are missing
   */
  private void validateCycloneDxStructure(JsonNode component) {
    JsonNode componentName = component.get("name");
    if (Objects.isNull(componentName) || componentName.asText().trim().isEmpty()) {
      throw new SbomValidationException("SBOM is missing required field: metadata.component.name");
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

