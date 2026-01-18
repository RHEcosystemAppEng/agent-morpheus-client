package com.redhat.ecosystemappeng.morpheus.dev;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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

  @SuppressWarnings("unchecked")
  @Startup
  void init() {
    var count = mongoClient.getDatabase(dbName).getCollection("reports").countDocuments();
    if (count != 0) {
      return;
    }
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
          metadata.put("sent_at", Instant.parse((String) metadata.get("sent_at")));
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
