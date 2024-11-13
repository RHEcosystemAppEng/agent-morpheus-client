package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.Updates;
import com.mongodb.client.model.WriteModel;
import com.redhat.ecosystemappeng.morpheus.model.sbom.CreationInfo;
import com.redhat.ecosystemappeng.morpheus.model.sbom.ExtractedLicensingInfo;
import com.redhat.ecosystemappeng.morpheus.model.sbom.InvalidSbomException;
import com.redhat.ecosystemappeng.morpheus.model.sbom.Product;
import com.redhat.ecosystemappeng.morpheus.model.sbom.SbomPackage;
import com.redhat.ecosystemappeng.morpheus.model.sbom.SecurityRef;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SbomParser {

  private static final Logger LOGGER = Logger.getLogger(SbomParser.class);
  private static final int BATCH_SIZE = 10000;

  @Inject
  ObjectMapper mapper;

  @Inject
  SbomPackageRepositoryService packageRepositoryService;

  @Inject
  ProductRepositoryService productRepositoryService;

  public String importSbom(String name, String version, InputStream data) {
    try {
      JsonNode tree = mapper.readTree(data);
      var packageIds = importPackages(tree);
      var rootNodeId = importRelationships(tree.withArray("relationships"), packageIds);
      return importProduct(name, version, tree, rootNodeId);
    } catch (IOException e) {
      throw new InvalidSbomException("Unable to parse SBOM data", e);
    }
  }

  private CreationInfo getCreationInfo(JsonNode node) {
    var created = getField(node, "created");
    var licenseListVersion = getField(node, "licenseListVersion");
    List<String> creators = new ArrayList<>();
    ((ArrayNode) node.withArray("creators")).forEach(c -> creators.add(c.asText()));

    return new CreationInfo(created, creators, licenseListVersion);
  }

  private List<ExtractedLicensingInfo> getLicensingInfos(ArrayNode hasExtractedLicensingInfos) {
    List<ExtractedLicensingInfo> infos = new ArrayList<>();
    hasExtractedLicensingInfos.forEach(l -> {
      var name = getField(l, "name");
      var licenseId = getField(l, "licenseId");
      var extractedText = getField(l, "extractedText");
      var comment = getField(l, "comment");
      infos.add(new ExtractedLicensingInfo(name, licenseId, comment, extractedText));
    });
    return infos;
  }

  private String getField(JsonNode node, String name) {
    if (node.hasNonNull(name)) {
      var value = node.get(name).asText();
      if (!"NOASSERTION".equals(value)) {
        return value;
      }
    }
    return null;
  }

  private WriteModel<SbomPackage> buildDependencyWrite(String from, String to) {
    var update = Updates.push("dependencies", to);
    return new UpdateOneModel<SbomPackage>(Filters.eq("_id", from), update);
  }

  private String importRelationships(ArrayNode relNodes, Set<String> packageIds) {
    String rootNodeRef = null;
    var batch = new ArrayList<WriteModel<SbomPackage>>();
    for (JsonNode rel : relNodes) {
      var type = getField(rel, "relationshipType");
      var elementId = getField(rel, "spdxElementId");
      var relatedElementId = getField(rel, "relatedSpdxElement");

      if (elementId.equals("SPDXRef-DOCUMENT")) {
        rootNodeRef = relatedElementId;
      } else if (!packageIds.contains(elementId) || !packageIds.contains(relatedElementId)) {
        // Most likely they're files
        LOGGER.infof("Ignoring broken spdxElementId [%s] relatedSpdxElement [%s] relationshipType [%s]", elementId,
            relatedElementId, type);
      } else {
        switch (type) {
          case "CONTAINS":
          case "DEPENDS_ON":
            batch.add(buildDependencyWrite(elementId, relatedElementId));
            break;
          case "DESCRIBED_BY":
          case "PACKAGE_OF":
          case "CONTAINED_BY":
          case "DEV_DEPENDENCY_OF":
          case "BUILD_DEPENDENCY_OF":
          case "RUNTIME_DEPENDENCY_OF":
          case "TEST_DEPENDENCY_OF":
          case "OPTIONAL_DEPENDENCY_OF":
          case "PROVIDED_DEPENDENCY_OF":
          case "DEPENDENCY_OF":
            batch.add(buildDependencyWrite(relatedElementId, elementId));
            break;
          default:
            // ignore
            break;
        }
      }

      if(batch.size() >= BATCH_SIZE) {
        packageRepositoryService.mongoCollection().bulkWrite(batch);
        batch.clear();
      }
    }
    packageRepositoryService.mongoCollection().bulkWrite(batch);
    LOGGER.infof("Created %s relationships", relNodes.size());
    return rootNodeRef;
  }

  private SbomPackage toSbomPackage(String id, JsonNode n) {
    var name = getField(n, "name");
    var version = getField(n, "versionInfo");
    var homepage = getField(n, "homepage");
    var supplier = getField(n, "supplier");
    var downloadLocation = getField(n, "downloadLocation");
    var packageFileName = getField(n, "packageFileName");
    var externalRefs = (ArrayNode) n.withArray("externalRefs");
    String purl = null;
    List<SecurityRef> secRefs = new ArrayList<>();
    for (JsonNode ref : externalRefs) {
      var refType = getField(ref, "referenceType");
      var category = getField(ref, "referenceCategory");
      if ("purl".equals(refType)) {
        purl = getField(ref, "referenceLocator");
      } else if ("SECURITY".equals(category)) {
        var value = getField(ref, "referenceLocator");
        secRefs.add(new SecurityRef(refType, value));
      }
    }
    return new SbomPackage(id, name, version, supplier, homepage, downloadLocation, purl, secRefs,
        packageFileName, Collections.emptyList());
  }

  private Set<String> importPackages(JsonNode tree) {
    Set<String> packageIds = new HashSet<>();
    List<SbomPackage> batch = new ArrayList<>();
    ArrayNode packages = tree.withArray("packages");
    LOGGER.infof("Found %s packages to load", packages.size());
    packages.forEach(n -> {
      var id = getField(n, "SPDXID");
      var pkg = toSbomPackage(id, n);
      batch.add(pkg);
      packageIds.add(pkg._id());
      if (batch.size() >= BATCH_SIZE) {
        packageRepositoryService.persistOrUpdate(batch);
        batch.clear();
      }
    });
    packageRepositoryService.persistOrUpdate(batch);
    LOGGER.infof("Loaded %s packages", packageIds.size());
    return packageIds;
  }

  private String importProduct(String name, String version, JsonNode tree, String rootPackage) {
    var ref = getField(tree, "name");
    var namespace = getField(tree, "documentNamespace");
    var dataLicense = getField(tree, "dataLicense");
    var creationInfo = getCreationInfo(tree.get("creationInfo"));
    var licenseInfo = getLicensingInfos(tree.withArray("hasExtractedLicensingInfos"));

    
    var existing = productRepositoryService.find(Filters.eq("ref", ref)).firstResult();
    var id = ObjectId.get();
    if(existing != null) {
      id = existing._id();
    }
    var product = new Product(id, ref, name, version, namespace, creationInfo, dataLicense, licenseInfo, rootPackage);
    productRepositoryService.persistOrUpdate(product);
    return product._id().toHexString();
  }

}
