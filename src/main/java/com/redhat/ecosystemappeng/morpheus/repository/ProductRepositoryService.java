package com.redhat.ecosystemappeng.morpheus.repository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.bson.Document;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Collation;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.Updates;
import org.bson.conversions.Bson;
import com.redhat.ecosystemappeng.morpheus.model.FailedComponent;
import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.service.RepositoryConstants;

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
  private static final String CVE_ID = "cve_id";
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
    Map<String, String> metadataWithUser = Objects.nonNull(product.metadata()) ? 
        new HashMap<>(product.metadata()) : new HashMap<>();
    metadataWithUser.put("user", byUser);
    
    var doc = new Document()
        .append(RepositoryConstants.ID_KEY, product.id())
        .append(NAME, product.name())
        .append(VERSION, product.version())
        .append(SUBMITTED_AT, product.submittedAt())
        .append(SUBMITTED_COUNT, product.submittedCount())
        .append(METADATA, metadataWithUser)
        .append(SUBMISSION_FAILURES, product.submissionFailures())
        .append(COMPLETED_AT, product.completedAt())
        .append(CVE_ID, product.cveId());

    getCollection().insertOne(doc);
    LOGGER.debugf("Saved product %s to %s collection", product.id(), COLLECTION);
  }

  public Product get(String id) {
    Document doc = getCollection().find(Filters.eq(RepositoryConstants.ID_KEY, id)).first();
    if (Objects.isNull(doc)) return null;
    
    return documentToProduct(doc);
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
    if (Objects.isNull(doc)) return null;
    
    @SuppressWarnings("unchecked")
    Map<String, String> metadata = (Map<String, String>) doc.get(METADATA, Map.class);
    if (Objects.nonNull(metadata)) {
      return metadata.get("user");
    }
    return null;
  }

  public void updateCompletedAt(String id, String completedAt) {
    getCollection().updateOne(Filters.eq(RepositoryConstants.ID_KEY, id), Updates.set(COMPLETED_AT, completedAt));
    LOGGER.debugf("Updated product %s completedAt timestamp to %s", id, completedAt);
  }

  public record ListResult(List<Product> products, long totalCount) {
  }

  public ListResult list(Integer page, Integer pageSize, String sortField, String sortDirection, String name, String cveId) {
    List<Bson> filters = new ArrayList<>();
    
    // Apply filters
    if (Objects.nonNull(name) && !name.isEmpty()) {
      filters.add(Filters.regex(NAME, name, "i")); // Case-insensitive partial match
    }
    if (Objects.nonNull(cveId) && !cveId.isEmpty()) {
      filters.add(Filters.regex(CVE_ID, cveId, "i")); // Case-insensitive partial match
    }
    
    Bson filter = filters.isEmpty() ? Filters.empty() : Filters.and(filters);
    
    // Count total matching documents
    long totalCount = getCollection().countDocuments(filter);
    
    // Build sort
    Bson sort = buildSort(sortField, sortDirection);
    
    // Apply pagination
    int skip = (Objects.nonNull(page) && page > 0) ? page * (Objects.nonNull(pageSize) ? pageSize : 100) : 0;
    int limit = (Objects.nonNull(pageSize) && pageSize > 0) ? pageSize : 100;
    
    // Query with pagination and sorting
    List<Product> products = new ArrayList<>();
    
    // Use collation with numeric ordering for alphanumeric sorting when sorting by name
    var findOperation = getCollection().find(filter);
    if (NAME.equals(sortField)) {
      // Apply collation with numeric ordering for alphanumeric sorting
      Collation collation = Collation.builder()
          .locale("en")
          .numericOrdering(true)
          .build();
      findOperation = findOperation.collation(collation);
    }
    
    findOperation
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .cursor()
        .forEachRemaining(d -> products.add(documentToProduct(d)));
    
    return new ListResult(products, totalCount);
  }

  private Bson buildSort(String sortField, String sortDirection) {
    String field = Objects.nonNull(sortField) ? sortField : "submittedAt";
    String direction = Objects.nonNull(sortDirection) ? sortDirection : "DESC";
    
    // Map sort field names to database field names
    String dbField;
    switch (field) {
      case "name":
        dbField = NAME;
        break;
      case "submittedAt":
        dbField = SUBMITTED_AT;
        break;
      case "completedAt":
        dbField = COMPLETED_AT;
        break;
      case "cveId":
        dbField = CVE_ID;
        break;
      default:
        dbField = SUBMITTED_AT;
    }
    
    if ("ASC".equalsIgnoreCase(direction)) {
      return Sorts.ascending(dbField);
    } else {
      return Sorts.descending(dbField);
    }
  }

  private Product documentToProduct(Document doc) {
    List<FailedComponent> submissionFailures = new ArrayList<>();
    List<Document> failuresDocs = doc.getList(SUBMISSION_FAILURES, Document.class);
    if (Objects.nonNull(failuresDocs)) {
      for (Document failureDoc : failuresDocs) {
        submissionFailures.add(new FailedComponent(
          failureDoc.getString("imageName"),
          failureDoc.getString("imageVersion"),
          failureDoc.getString("error")
        ));
      }
    }

    @SuppressWarnings("unchecked")
    Map<String, String> metadata = (Map<String, String>) doc.get(METADATA, Map.class);

    return new Product(
        doc.getString(RepositoryConstants.ID_KEY),
        doc.getString(NAME),
        doc.getString(VERSION),
        doc.getString(SUBMITTED_AT),
        doc.getInteger(SUBMITTED_COUNT),
        metadata,
        submissionFailures,
        doc.getString(COMPLETED_AT),
        doc.getString(CVE_ID)
    );
  }
}

