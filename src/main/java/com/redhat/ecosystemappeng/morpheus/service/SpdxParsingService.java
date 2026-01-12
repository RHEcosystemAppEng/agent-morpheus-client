package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SpdxParsingService {

  private static final Logger LOGGER = Logger.getLogger(SpdxParsingService.class);

  @Inject
  ObjectMapper objectMapper;

  public record ProductInfo(String id, String name, String version) {}
  
  public record ComponentInfo(String spdxId, String name, String version, String purl) {}

  public record ParsedSpdx(ProductInfo productInfo, List<ComponentInfo> components) {}

  public ParsedSpdx parse(JsonNode spdxJson) {
    String spdxId = spdxJson.has("SPDXID") ? spdxJson.get("SPDXID").asText() : null;
    if (Objects.isNull(spdxId)) {
      throw new IllegalArgumentException("SPDX document missing SPDXID field");
    }

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
          rel.has("spdxElementId") && spdxId.equals(rel.get("spdxElementId").asText()) &&
          rel.has("relatedSpdxElement")) {
        productSpdxId = rel.get("relatedSpdxElement").asText();
        break;
      }
    }

    if (Objects.isNull(productSpdxId)) {
      throw new IllegalArgumentException("No DESCRIBES relationship found in SPDX document");
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
      throw new IllegalArgumentException("Product package not found: " + productSpdxId);
    }

    // Extract product name and version
    String productName = productPackage.has("name") ? productPackage.get("name").asText() : null;
    String productVersion = productPackage.has("versionInfo") ? productPackage.get("versionInfo").asText() : "";
    
    if (Objects.isNull(productName)) {
      // Fallback to document name
      productName = spdxJson.has("name") ? spdxJson.get("name").asText() : "unknown";
    }

    // Find all components with PACKAGE_OF relationship
    List<String> componentSpdxIds = new ArrayList<>();
    for (JsonNode rel : relationships) {
      if (rel.has("relationshipType") && "PACKAGE_OF".equals(rel.get("relationshipType").asText()) &&
          rel.has("relatedSpdxElement") && productSpdxId.equals(rel.get("relatedSpdxElement").asText()) &&
          rel.has("spdxElementId")) {
        componentSpdxIds.add(rel.get("spdxElementId").asText());
      }
    }

    // Extract component information
    List<ComponentInfo> components = new ArrayList<>();
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

        components.add(new ComponentInfo(componentSpdxId, componentName, componentVersion, purl));
      }
    }

    LOGGER.debugf("Parsed SPDX: product=%s, version=%s, components=%d", productName, productVersion, components.size());

    ProductInfo productInfo = new ProductInfo(null, productName, productVersion);
    return new ParsedSpdx(productInfo, components);
  }
}

