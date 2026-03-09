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
    ArrayNode packages = spdxJson.has("packages") && spdxJson.get("packages").isArray() 
        ? (ArrayNode) spdxJson.get("packages") 
        : objectMapper.createArrayNode();
    
    ArrayNode relationships = spdxJson.has("relationships") && spdxJson.get("relationships").isArray()
        ? (ArrayNode) spdxJson.get("relationships")
        : objectMapper.createArrayNode();

    // Find DESCRIBES relationship to get product package ID
    String productSpdxId = null;
    for (JsonNode rel : relationships) {
      if (rel.has("relationshipType") && "DESCRIBES".equals(rel.get("relationshipType").asText()) &&          
          rel.has("relatedSpdxElement")) {
        productSpdxId = rel.get("relatedSpdxElement").asText();
        break;
      }
    }

    if (Objects.isNull(productSpdxId)) {
      throw new SbomValidationException("No DESCRIBES relationship found in SPDX document");
    }

    // Find product package
    JsonNode productPackage = null;
    for (JsonNode pkg : packages) {
      if (pkg.has("SPDXID") && productSpdxId.equals(pkg.get("SPDXID").asText())) {
        productPackage = pkg;
        break;
      }
    }

    if (Objects.isNull(productPackage)) {
      throw new SbomValidationException("Product package not found: " + productSpdxId);
    }

    // Extract product name and version
    String productName = productPackage.has("name") ? productPackage.get("name").asText() : null;
    String productVersion = productPackage.has("versionInfo") ? productPackage.get("versionInfo").asText() : "";
    
    if (Objects.isNull(productName)) {
      throw new SbomValidationException("Product name not found in DESCRIBES relationship package with SPDX ID: " + productSpdxId);
    }

    // Extract CPE from product package externalRefs
    String cpe = extractCpeFromPackage(productPackage);

    // Find all components with PACKAGE_OF relationship
    List<String> componentSpdxIds = new ArrayList<>();
    for (JsonNode rel : relationships) {
      if (rel.has("relationshipType") && "PACKAGE_OF".equals(rel.get("relationshipType").asText()) &&
          rel.has("relatedSpdxElement") && productSpdxId.equals(rel.get("relatedSpdxElement").asText()) &&
          rel.has("spdxElementId")) {
        componentSpdxIds.add(rel.get("spdxElementId").asText());
      }
    }
    ProductInfo productInfo = new ProductInfo(productSpdxId, productName, productVersion, cpe);

    // Extract component information: supported (OCI purl) vs unsupported (no purl or non-OCI purl)
    List<ComponentInfo> components = new ArrayList<>();
    List<UnsupportedComponentInfo> unsupportedComponents = new ArrayList<>();
    for (String componentSpdxId : componentSpdxIds) {
      JsonNode componentPackage = null;
      for (JsonNode pkg : packages) {
        if (pkg.has("SPDXID") && componentSpdxId.equals(pkg.get("SPDXID").asText())) {
          componentPackage = pkg;
          break;
        }
      }

      if (Objects.nonNull(componentPackage)) {
        String componentName = componentPackage.has("name") ? componentPackage.get("name").asText() : "";
        String componentVersion = componentPackage.has("versionInfo") ? componentPackage.get("versionInfo").asText() : "";

        // Extract purl from externalRefs
        String purl = null;
        if (componentPackage.has("externalRefs") && componentPackage.get("externalRefs").isArray()) {
          ArrayNode externalRefs = (ArrayNode) componentPackage.get("externalRefs");
          for (JsonNode ref : externalRefs) {
            if (ref.has("referenceCategory") && "PACKAGE_MANAGER".equals(ref.get("referenceCategory").asText()) &&
                ref.has("referenceType") && "purl".equals(ref.get("referenceType").asText()) &&
                ref.has("referenceLocator")) {
              purl = ref.get("referenceLocator").asText();
              break;
            }
          }
        }

        if (Objects.isNull(purl) || !purl.startsWith("pkg:oci/")) {
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
   * Extracts CPE from package externalRefs where referenceCategory is SECURITY and referenceType is cpe22Type
   * @param packageNode The package JSON node
   * @return CPE value or null if not found
   */
  private String extractCpeFromPackage(JsonNode packageNode) {
    if (!packageNode.has("externalRefs") || !packageNode.get("externalRefs").isArray()) {
      return null;
    }

    ArrayNode externalRefs = (ArrayNode) packageNode.get("externalRefs");
    for (JsonNode ref : externalRefs) {
      if (ref.has("referenceCategory") && "SECURITY".equals(ref.get("referenceCategory").asText()) &&
          ref.has("referenceType") && "cpe22Type".equals(ref.get("referenceType").asText()) &&
          ref.has("referenceLocator")) {
        return ref.get("referenceLocator").asText();
      }
    }

    return null;
  }

  /**
   * Parses image from OCI PURL format: pkg:oci/name@sha256:hash?repository_url=...&tag=...
   * Returns: repository_url@sha256:hash
   */
  private String parseImageFromPurl(String purl) {
    if (purl == null || !purl.startsWith("pkg:oci/")) {
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
      if (param.startsWith("repository_url=")) {
        repositoryUrl = java.net.URLDecoder.decode(
            param.substring("repository_url=".length()), 
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

