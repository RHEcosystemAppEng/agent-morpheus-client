package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.bson.Document;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.redhat.ecosystemappeng.morpheus.model.FailedComponent;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
@RegisterForReflection(targets = { Document.class })
public class SubmissionFailureRepositoryService {

  private static final Logger LOGGER = Logger.getLogger(SubmissionFailureRepositoryService.class);

  private static final String COLLECTION = "submission_failures";
  private static final String PRODUCT_ID = "product_id";
  private static final String IMAGE = "image";
  private static final String ERROR = "error";

  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @Inject
  ObjectMapper objectMapper;

  public MongoCollection<Document> getCollection() {
    return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
  }

  public void save(String productId, String image, String error) {
    var doc = new Document()
        .append(PRODUCT_ID, productId)
        .append(IMAGE, image)
        .append(ERROR, error);
    getCollection().insertOne(doc);
  }

  public List<FailedComponent> get(String productId) {
    List<FailedComponent> failedComponents = new ArrayList<>();
    getCollection().find(Filters.eq(PRODUCT_ID, productId)).forEach(doc -> {
      failedComponents.add(new FailedComponent(productId, doc.getString(IMAGE), doc.getString(ERROR)));
    });
    return failedComponents;
  }

  public void remove(String productId) {
    getCollection().deleteOne(Filters.eq(PRODUCT_ID, productId)).wasAcknowledged();
  }

  public void remove(Collection<String> productIds) {
    getCollection().deleteMany(Filters.in(PRODUCT_ID, productIds)).wasAcknowledged();
  }
}
