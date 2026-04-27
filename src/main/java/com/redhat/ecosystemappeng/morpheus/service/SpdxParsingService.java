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

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SpdxParsingService {

  private static final Logger LOGGER = Logger.getLogger(SpdxParsingService.class);

  // SPDX document identity and version (other versions have different schemas)
  private static final String SPDX_FIELD_SPDX_VERSION = "spdxVersion";
  /** Supported SPDX specification version; only 2.3 schema is supported. */
  public static final String SPDX_VERSION_2_3 = "SPDX-2.3";

  // SPDX document top-level fields
  private static final String SPDX_FIELD_PACKAGES = "packages";
  private static final String SPDX_FIELD_RELATIONSHIPS = "relationships";

  // Package object fields
  private static final String SPDX_FIELD_SPDXID = "SPDXID";
  private static final String SPDX_FIELD_NAME = "name";
  private static final String SPDX_FIELD_VERSION_INFO = "versionInfo";
  private static final String SPDX_FIELD_EXTERNAL_REFS = "externalRefs";

  // Relationship object fields
  private static final String SPDX_FIELD_RELATIONSHIP_TYPE = "relationshipType";
  private static final String SPDX_FIELD_RELATED_SPDX_ELEMENT = "relatedSpdxElement";
  private static final String SPDX_FIELD_SPDX_ELEMENT_ID = "spdxElementId";

  // Relationship type values
  private static final String SPDX_RELATIONSHIP_DESCRIBES = "DESCRIBES";
  private static final String SPDX_RELATIONSHIP_PACKAGE_OF = "PACKAGE_OF";

  // External ref object fields
  private static final String SPDX_FIELD_REFERENCE_CATEGORY = "referenceCategory";
  private static final String SPDX_FIELD_REFERENCE_TYPE = "referenceType";
  private static final String SPDX_FIELD_REFERENCE_LOCATOR = "referenceLocator";

  // External ref category/type values
  private static final String SPDX_REF_CATEGORY_PACKAGE_MANAGER = "PACKAGE_MANAGER";
  private static final String SPDX_REF_CATEGORY_SECURITY = "SECURITY";
  private static final String SPDX_REF_TYPE_PURL = "purl";
  private static final String SPDX_REF_TYPE_CPE22 = "cpe22Type";

  // OCI PURL
  private static final String PURL_OCI_PREFIX = "pkg:oci/";
  private static final String PURL_QUERY_PARAM_REPOSITORY_URL = "repository_url=";

  /** Error message when parse result has zero supported (OCI) components. */
  public static final String NO_SUPPORTED_COMPONENTS_MESSAGE =
      "At least one supported component is required. Supported components are packages with a PACKAGE_OF relationship to the product that have a purl (package URL) starting with pkg:oci. No such components were found.";

  @Inject
  ObjectMapper objectMapper;

  public record ProductInfo(String spdxId, String name, String version, String cpe) {}

  public record ComponentInfo(String spdxId, String name, String version, String purl, String image) {}

  /** Component with no purl or non-OCI purl; not sent through the pipeline. */
  public record UnsupportedComponentInfo(String spdxId, String name, String version, String purl) {}

  public record ParsedSpdx(ProductInfo productInfo, List<ComponentInfo> components, List<UnsupportedComponentInfo> unsupportedComponents) {}

  public ParsedSpdx parse(JsonNode spdxJson) {
    validateSpdxDocument(spdxJson);

    ArrayNode packages = spdxJson.has(SPDX_FIELD_PACKAGES) && spdxJson.get(SPDX_FIELD_PACKAGES).isArray()
        ? (ArrayNode) spdxJson.get(SPDX_FIELD_PACKAGES)
        : objectMapper.createArrayNode();

    ArrayNode relationships = spdxJson.has(SPDX_FIELD_RELATIONSHIPS) && spdxJson.get(SPDX_FIELD_RELATIONSHIPS).isArray()
        ? (ArrayNode) spdxJson.get(SPDX_FIELD_RELATIONSHIPS)
        : objectMapper.createArrayNode();

    // Find DESCRIBES relationship to get product package ID
    String productSpdxId = null;
    for (JsonNode rel : relationships) {
      if (rel.has(SPDX_FIELD_RELATIONSHIP_TYPE) && SPDX_RELATIONSHIP_DESCRIBES.equals(rel.get(SPDX_FIELD_RELATIONSHIP_TYPE).asText())
          && rel.has(SPDX_FIELD_RELATED_SPDX_ELEMENT)) {
        productSpdxId = rel.get(SPDX_FIELD_RELATED_SPDX_ELEMENT).asText();
        break;
      }
    }

    if (Objects.isNull(productSpdxId)) {
      throw new SbomValidationException("No DESCRIBES relationship found in SPDX document");
    }

    // Find product package
    JsonNode productPackage = null;
    for (JsonNode pkg : packages) {
      if (pkg.has(SPDX_FIELD_SPDXID) && productSpdxId.equals(pkg.get(SPDX_FIELD_SPDXID).asText())) {
        productPackage = pkg;
        break;
      }
    }

    if (Objects.isNull(productPackage)) {
      throw new SbomValidationException("Product package not found: " + productSpdxId);
    }

    // Extract product name and version
    String productName = productPackage.has(SPDX_FIELD_NAME) ? productPackage.get(SPDX_FIELD_NAME).asText() : null;
    String productVersion = productPackage.has(SPDX_FIELD_VERSION_INFO) ? productPackage.get(SPDX_FIELD_VERSION_INFO).asText() : "";
    
    if (Objects.isNull(productName)) {
      throw new SbomValidationException("Product name not found in DESCRIBES relationship package with SPDX ID: " + productSpdxId);
    }

    // Extract CPE from product package externalRefs
    String cpe = extractCpeFromPackage(productPackage);

    // Find all components with PACKAGE_OF relationship
    List<String> componentSpdxIds = new ArrayList<>();
    for (JsonNode rel : relationships) {
      if (rel.has(SPDX_FIELD_RELATIONSHIP_TYPE) && SPDX_RELATIONSHIP_PACKAGE_OF.equals(rel.get(SPDX_FIELD_RELATIONSHIP_TYPE).asText())
          && rel.has(SPDX_FIELD_RELATED_SPDX_ELEMENT) && productSpdxId.equals(rel.get(SPDX_FIELD_RELATED_SPDX_ELEMENT).asText())
          && rel.has(SPDX_FIELD_SPDX_ELEMENT_ID)) {
        componentSpdxIds.add(rel.get(SPDX_FIELD_SPDX_ELEMENT_ID).asText());
      }
    }
    ProductInfo productInfo = new ProductInfo(productSpdxId, productName, productVersion, cpe);

    // Extract component information: supported (OCI purl) vs unsupported (no purl or non-OCI purl)
    List<ComponentInfo> components = new ArrayList<>();
    List<UnsupportedComponentInfo> unsupportedComponents = new ArrayList<>();
    for (String componentSpdxId : componentSpdxIds) {
      JsonNode componentPackage = null;
      for (JsonNode pkg : packages) {
        if (pkg.has(SPDX_FIELD_SPDXID) && componentSpdxId.equals(pkg.get(SPDX_FIELD_SPDXID).asText())) {
          componentPackage = pkg;
          break;
        }
      }

      if (Objects.nonNull(componentPackage)) {
        String componentName = componentPackage.has(SPDX_FIELD_NAME) ? componentPackage.get(SPDX_FIELD_NAME).asText() : "";
        String componentVersion = componentPackage.has(SPDX_FIELD_VERSION_INFO) ? componentPackage.get(SPDX_FIELD_VERSION_INFO).asText() : "";

        // Extract purl from externalRefs
        String purl = null;
        if (componentPackage.has(SPDX_FIELD_EXTERNAL_REFS) && componentPackage.get(SPDX_FIELD_EXTERNAL_REFS).isArray()) {
          ArrayNode externalRefs = (ArrayNode) componentPackage.get(SPDX_FIELD_EXTERNAL_REFS);
          for (JsonNode ref : externalRefs) {
            if (ref.has(SPDX_FIELD_REFERENCE_CATEGORY) && SPDX_REF_CATEGORY_PACKAGE_MANAGER.equals(ref.get(SPDX_FIELD_REFERENCE_CATEGORY).asText())
                && ref.has(SPDX_FIELD_REFERENCE_TYPE) && SPDX_REF_TYPE_PURL.equals(ref.get(SPDX_FIELD_REFERENCE_TYPE).asText())
                && ref.has(SPDX_FIELD_REFERENCE_LOCATOR)) {
              purl = ref.get(SPDX_FIELD_REFERENCE_LOCATOR).asText();
              break;
            }
          }
        }

        if (Objects.isNull(purl) || !purl.startsWith(PURL_OCI_PREFIX)) {
          unsupportedComponents.add(new UnsupportedComponentInfo(componentSpdxId, componentName, componentVersion, purl));
          continue;
        }
        // Extract image from purl pkg:oci/gitops-operator-bundle@sha256:<sha>?repository_url=...
        String image = parseImageFromPurl(purl);
        if (Objects.isNull(image)) {
          unsupportedComponents.add(new UnsupportedComponentInfo(componentSpdxId, componentName, componentVersion, purl));
          continue;
        }
        components.add(new ComponentInfo(componentSpdxId, componentName, componentVersion, purl, image));
      }
    }

    if (components.isEmpty()) {
      throw new SbomValidationException(NO_SUPPORTED_COMPONENTS_MESSAGE);
    }

    LOGGER.debugf("Parsed SPDX: product=%s, version=%s, components=%d, unsupported=%d, cpe=%s",
        productName, productVersion, components.size(), unsupportedComponents.size(), cpe);

    return new ParsedSpdx(productInfo, components, unsupportedComponents);
  }

  /**
   * Validates that the root node is an SPDX document and that the SPDX version is 2.3.
   * Other SPDX versions use different schemas and are not supported.
   *
   * @param spdxJson root JSON node of the document
   * @throws SbomValidationException if the document is not SPDX or version is not 2.3
   */
  private void validateSpdxDocument(JsonNode spdxJson) {
    if (spdxJson == null || !spdxJson.isObject()) {
      throw new SbomValidationException("Invalid document: expected a JSON object (SPDX SBOM).");
    }
    if (!spdxJson.has(SPDX_FIELD_SPDX_VERSION)) {
      throw new SbomValidationException("Document is not a valid SPDX SBOM: missing spdxVersion field.");
    }
    String version = spdxJson.get(SPDX_FIELD_SPDX_VERSION).asText();
    if (!SPDX_VERSION_2_3.equals(version)) {
      throw new SbomValidationException(
          "Unsupported SPDX version: " + version + ". Only " + SPDX_VERSION_2_3 + " is supported.");
    }
  }

  /**
   * Extracts CPE from package externalRefs where referenceCategory is SECURITY and referenceType is cpe22Type
   * @param packageNode The package JSON node
   * @return CPE value or null if not found
   */
  private String extractCpeFromPackage(JsonNode packageNode) {
    if (!packageNode.has(SPDX_FIELD_EXTERNAL_REFS) || !packageNode.get(SPDX_FIELD_EXTERNAL_REFS).isArray()) {
      return null;
    }

    ArrayNode externalRefs = (ArrayNode) packageNode.get(SPDX_FIELD_EXTERNAL_REFS);
    for (JsonNode ref : externalRefs) {
      if (ref.has(SPDX_FIELD_REFERENCE_CATEGORY) && SPDX_REF_CATEGORY_SECURITY.equals(ref.get(SPDX_FIELD_REFERENCE_CATEGORY).asText())
          && ref.has(SPDX_FIELD_REFERENCE_TYPE) && SPDX_REF_TYPE_CPE22.equals(ref.get(SPDX_FIELD_REFERENCE_TYPE).asText())
          && ref.has(SPDX_FIELD_REFERENCE_LOCATOR)) {
        return ref.get(SPDX_FIELD_REFERENCE_LOCATOR).asText();
      }
    }

    return null;
  }

  /**
   * Parses image from OCI PURL format: pkg:oci/name@sha256:hash?repository_url=...&tag=...
   * Returns: repository_url@sha256:hash
   */
  private String parseImageFromPurl(String purl) {
    if (purl == null || !purl.startsWith(PURL_OCI_PREFIX)) {
      return null;
    }

    // Extract SHA256 from @sha256:... part
    int shaIndex = purl.indexOf("@sha256:");
    if (shaIndex == -1) {
      return null;
    }
    
    int shaEndIndex = purl.indexOf("?", shaIndex);
    if (shaEndIndex == -1) {
      shaEndIndex = purl.length();
    }
    String sha = purl.substring(shaIndex + 1, shaEndIndex); // +1 to skip @, includes sha256:hash

    // Extract repository_url from query parameters
    int queryIndex = purl.indexOf("?");
    if (queryIndex == -1) {
      return null;
    }

    String queryString = purl.substring(queryIndex + 1);
    String repositoryUrl = null;
    
    for (String param : queryString.split("&")) {
      if (param.startsWith(PURL_QUERY_PARAM_REPOSITORY_URL)) {
        repositoryUrl = java.net.URLDecoder.decode(
            param.substring(PURL_QUERY_PARAM_REPOSITORY_URL.length()), 
            java.nio.charset.StandardCharsets.UTF_8);
        break;
      }
    }

    if (repositoryUrl != null && !sha.isEmpty()) {
      return repositoryUrl + "@" + sha;
    }

    return null;
  }
} 

