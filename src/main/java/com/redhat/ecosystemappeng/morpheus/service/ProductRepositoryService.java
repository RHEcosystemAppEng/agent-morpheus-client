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
import com.redhat.ecosystemappeng.morpheus.model.Product;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
@RegisterForReflection(targets = { Document.class })
public class ProductRepositoryService {

  private static final Logger LOGGER = Logger.getLogger(ProductRepositoryService.class);

  private static final String COLLECTION = "products";
  private static final String ID = "_id";
  private static final String NAME = "name";
  private static final String VERSION = "version";
  private static final String SUBMITTED_AT = "submitted_at";
  private static final String COMPLETED_AT = "completed_at";
  private static final String SUBMITTED_COUNT = "submitted_count";
  private static final String SUBMISSION_FAILURES = "submission_failures";

  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @Inject
  ObjectMapper objectMapper;

  public MongoCollection<Document> getCollection() {
    return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
  }

  public void save(Product product) {
    var doc = new Document()
        .append(ID, product.id())
        .append(NAME, product.name())
        .append(VERSION, product.version())
        .append(SUBMITTED_AT, product.submittedAt())
        .append(COMPLETED_AT, product.completedAt())
        .append(SUBMITTED_COUNT, product.submittedCount())
        .append(SUBMISSION_FAILURES, product.submissionFailures());
    
    getCollection().insertOne(doc);
  }

  public Product get(String id) {
    Document doc = getCollection().find(Filters.eq(ID, id)).first();
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

    Product product = new Product(
        doc.getString(ID),
        doc.getString(NAME),
        doc.getString(VERSION),
        doc.getString(SUBMITTED_AT),
        doc.getString(COMPLETED_AT),
        doc.getInteger(SUBMITTED_COUNT),
        submissionFailures
    );

    return product;
  }

  public void remove(String id) {
    getCollection().deleteOne(Filters.eq(ID, id)).wasAcknowledged();
  }

  public void remove(Collection<String> ids) {
    getCollection().deleteMany(Filters.in(ID, ids)).wasAcknowledged();
  }
}
