package com.redhat.ecosystemappeng.morpheus.dev;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.bson.Document;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.mongodb.client.MongoClient;

import io.quarkus.arc.profile.IfBuildProfile;
import io.quarkus.runtime.Startup;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;

@Singleton
@IfBuildProfile("dev")
public class DatabaseInit {

  private static final Logger LOGGER = Logger.getLogger(DatabaseInit.class);

  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @ConfigProperty(name = "morpheus.repository.reports-path", defaultValue = "src/test/resources/devservices/reports")
  String reportsPath;

  @ConfigProperty(name = "morpheus.repository.products-path", defaultValue = "src/test/resources/devservices/products")
  String productsPath;

  @Startup
  void init() {
    var reportsCount = mongoClient.getDatabase(dbName).getCollection("reports").countDocuments();
    var productsCount = mongoClient.getDatabase(dbName).getCollection("products").countDocuments();
    
    if (reportsCount != 0 && productsCount != 0) {
      return;
    }

    // Load products first
    if (productsCount == 0) {
      loadProducts();
    }

    // Load reports and associate them with products
    if (reportsCount == 0) {
      loadReports();
    }
  }

  private void loadProducts() {
    try {
      var classLoaderPath = this.getClass().getClassLoader().getResource(productsPath);
      File folder = null;

      if (classLoaderPath != null) {
        folder = new File(classLoaderPath.toURI());
      }
      if (folder == null || !folder.isDirectory()) {
        folder = new File(productsPath);
        if (!folder.isDirectory()) {
          LOGGER.warnf("Products directory not found: %s. Skipping product loading.", productsPath);
          return;
        }
      }

      List<Document> docs = new ArrayList<>();
      Files.walk(folder.toPath()).filter(Files::isRegularFile).forEach(f -> {
        try {
          var doc = Document.parse(Files.readString(f));
          // Convert camelCase JSON fields to snake_case database fields
          @SuppressWarnings("unchecked")
          Map<String, String> metadataMap = doc.get("metadata", Map.class) != null ? 
              new HashMap<>((Map<String, String>) doc.get("metadata", Map.class)) : 
              new HashMap<>();
          metadataMap.put("user", "system");
          
          Document dbDoc = new Document()
              .append("_id", doc.getString("id"))
              .append("name", doc.getString("name"))
              .append("version", doc.getString("version"))
              .append("submitted_at", doc.getString("submittedAt"))
              .append("submitted_count", doc.getInteger("submittedCount"))
              .append("cve_id", doc.getString("cveId"))
              .append("metadata", metadataMap)
              .append("submission_failures", doc.get("submissionFailures", List.class) != null ? 
                  doc.get("submissionFailures", List.class) : 
                  new ArrayList<>())
              .append("completed_at", doc.getString("completedAt"));
          docs.add(dbDoc);
        } catch (Exception e) {
          LOGGER.errorf("Ignoring invalid product document: %s", f, e);
        }
      });
      mongoClient.getDatabase(dbName).getCollection("products").insertMany(docs);
      LOGGER.infof("Loaded %s products into database", docs.size());
    } catch (IOException | URISyntaxException e) {
      LOGGER.error("Unable to load products into database", e);
    }
  }

  private void loadReports() {
    try {
      var classLoaderPath = this.getClass().getClassLoader().getResource(reportsPath);
      File folder = null;

      if (classLoaderPath != null) {
        folder = new File(classLoaderPath.toURI());
      }
      if (folder == null || !folder.isDirectory()) {
        folder = new File(reportsPath);
        if (!folder.isDirectory()) {
          throw new IllegalArgumentException(
              "The morpheus.repository.reports-path must be a valid directory: " + reportsPath);
        }
      }

      List<Document> docs = new ArrayList<>();
      Files.walk(folder.toPath()).filter(Files::isRegularFile).forEach(f -> {
        try {
          var doc = Document.parse(Files.readString(f));
          var metadata = doc.get("metadata", Document.class);
          metadata.put("submitted_at", Instant.parse((String) metadata.get("submitted_at")));
          if (Objects.nonNull(metadata.get("sent_at"))) {
            metadata.put("sent_at", Instant.parse((String) metadata.get("sent_at")));
          }
          docs.add(doc);
        } catch (Exception e) {
          LOGGER.errorf("Ignoring invalid document: %s", f, e);
        }
      });
      mongoClient.getDatabase(dbName).getCollection("reports").insertMany(docs);
      LOGGER.infof("Loaded %s reports into database", docs.size());
    } catch (IOException | URISyntaxException e) {
      LOGGER.error("Unable to load reports into database", e);
    }
  }
}
