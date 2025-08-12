package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.redhat.ecosystemappeng.morpheus.model.FailedComponent;
import com.redhat.ecosystemappeng.morpheus.model.Product;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
@RegisterForReflection(targets = { Document.class })
public class ProductRepositoryService {

  private static final Logger LOGGER = Logger.getLogger(ProductRepositoryService.class);

  private static final String COLLECTION = "products";
  private static final String NAME = "name";
  private static final String VERSION = "version";
  private static final String SUBMITTED_AT = "submitted_at";
  private static final String COMPLETED_AT = "completed_at";
  private static final String SUBMITTED_COUNT = "submitted_count";
  private static final String SUBMISSION_FAILURES = "submission_failures";
  private static final String METADATA = "metadata";
  
  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @Inject
  ObjectMapper objectMapper;

  public MongoCollection<Document> getCollection() {
    return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
  }

  public void save(Product product, String byUser) {
    Map<String, String> metadataWithUser = product.metadata() != null ? 
        new HashMap<>(product.metadata()) : new HashMap<>();
    metadataWithUser.put("user", byUser);
    
    var doc = new Document()
        .append(RepositoryConstants.ID_KEY, product.id())
        .append(NAME, product.name())
        .append(VERSION, product.version())
        .append(SUBMITTED_AT, product.submittedAt())
        .append(SUBMITTED_COUNT, product.submittedCount())
        .append(METADATA, metadataWithUser)
        .append(SUBMISSION_FAILURES, product.submissionFailures());

    getCollection().insertOne(doc);
    LOGGER.debugf("Saved product %s to %s collection", product.id(), COLLECTION);
  }

  public Product get(String id) {
    Document doc = getCollection().find(Filters.eq(RepositoryConstants.ID_KEY, id)).first();
    if (doc == null) return null;
    
    List<FailedComponent> submissionFailures = new ArrayList<>();
    List<Document> failuresDocs = doc.getList(SUBMISSION_FAILURES, Document.class);
    if (failuresDocs != null) {
      for (Document failureDoc : failuresDocs) {
        submissionFailures.add(new FailedComponent(
          failureDoc.getString("imageName"),
          failureDoc.getString("imageVersion"),
          failureDoc.getString("error")
        ));
      }
    }

    Map<String, String> metadata = doc.get(METADATA, Map.class);

    return new Product(
        doc.getString(RepositoryConstants.ID_KEY),
        doc.getString(NAME),
        doc.getString(VERSION),
        doc.getString(SUBMITTED_AT),
        doc.getInteger(SUBMITTED_COUNT),
        metadata,
        submissionFailures,
        doc.getString(COMPLETED_AT)
    );
  }

  public void remove(String id) {
    getCollection().deleteOne(Filters.eq(RepositoryConstants.ID_KEY, id)).wasAcknowledged();
    LOGGER.debugf("Removed product %s from %s collection", id, COLLECTION);
  }

  public void remove(Collection<String> ids) {
    getCollection().deleteMany(Filters.in(RepositoryConstants.ID_KEY, ids)).wasAcknowledged();
    LOGGER.debugf("Removed products %s from %s collection", ids.toString(), COLLECTION);
  }

  public String getUserName(String id) {
    Document doc = getCollection().find(Filters.eq(RepositoryConstants.ID_KEY, id)).first();
    if (doc == null) return null;
    
    Map<String, String> metadata = doc.get(METADATA, Map.class);
    if (metadata != null) {
      return metadata.get("user");
    }
    return null;
  }

  public void updateCompletedAt(String id, String completedAt) {
    getCollection().updateOne(Filters.eq(RepositoryConstants.ID_KEY, id), Updates.set(COMPLETED_AT, completedAt));
    LOGGER.debugf("Updated product %s completedAt timestamp to %s", id, completedAt);
  }
}
