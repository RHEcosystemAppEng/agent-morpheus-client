package com.redhat.ecosystemappeng.morpheus.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;

import com.mongodb.client.MongoCursor;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.Updates;
import com.redhat.ecosystemappeng.morpheus.model.Justification;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.Report;
import com.redhat.ecosystemappeng.morpheus.model.SortField;
import com.redhat.ecosystemappeng.morpheus.model.SortType;
import com.redhat.ecosystemappeng.morpheus.model.VulnResult;
import com.redhat.ecosystemappeng.morpheus.model.ProductReportSummary;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
@RegisterForReflection(targets = { Document.class })
public class ReportRepositoryService {

  private static final Logger LOGGER = Logger.getLogger(ReportRepositoryService.class);

  private static final String SENT_AT = "sent_at";
  private static final String SUBMITTED_AT = "submitted_at";
  private static final String PRODUCT_ID = "product_id";
  private static final Collection<String> METADATA_DATES = List.of(SUBMITTED_AT, SENT_AT);
  private static final String COLLECTION = "reports";
  private static final Map<String, Bson> STATUS_FILTERS = Map.of(
      "completed", Filters.ne("input.scan.completed_at", null),
      "sent",
      Filters.and(Filters.ne("metadata." + SENT_AT, null), Filters.eq("error", null),
          Filters.eq("input.scan.completed_at", null)),
      "failed", Filters.ne("error", null),
      "queued", Filters.and(Filters.ne("metadata." + SUBMITTED_AT, null), Filters.eq("metadata." + SENT_AT, null),
          Filters.eq("error", null), Filters.eq("input.scan.completed_at", null)),
      "expired", Filters.and(Filters.ne("error", null),Filters.eq("error.type", "expired")),
      "pending", Filters.and(
        Filters.eq("metadata." + SENT_AT, null),
        Filters.eq("metadata." + SUBMITTED_AT, null),
        Filters.ne("metadata." + PRODUCT_ID, null)));

  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @Inject
  ObjectMapper objectMapper;

  public MongoCollection<Document> getCollection() {
    return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
  }

  private Map<String, String> extractMetadata(Document doc) {
    var metadata = new HashMap<String, String>();
    var metadataField = doc.get("metadata", Document.class);
    if (metadataField != null) {
      metadataField.keySet().forEach(key -> {
        if (METADATA_DATES.contains(key)) {
          Date date = metadataField.getDate(key);
          metadata.put(key, date.toInstant().toString());
        } else {
          metadata.put(key, metadataField.getString(key));
        }
      });
    }
    return metadata;
  }

  public Report toReport(Document doc) {
    if (doc == null) {
      return null;
    }
    var input = doc.get("input", Document.class);
    var scan = input.get("scan", Document.class);
    var image = input.get("image", Document.class);
    var output = doc.getList("output", Document.class);
    var metadata = extractMetadata(doc);
    var vulnIds = new HashSet<VulnResult>();
    if (output != null) {
      output.forEach(o -> {
        var vulnId = o.getString("vuln_id");
        var justification = o.get("justification", Document.class);

        vulnIds.add(new VulnResult(vulnId,
            new Justification(justification.getString("status"), justification.getString("label"))));
      });
    } else {
      scan.getList("vulns", Document.class).forEach(v -> {
        var vulnId = v.getString("vuln_id");
        vulnIds.add(new VulnResult(vulnId, null));
      });
    }

    var id = doc.get(RepositoryConstants.ID_KEY, ObjectId.class).toHexString();

    return new Report(id, scan.getString(RepositoryConstants.ID_SORT),
        scan.getString("started_at"),
        scan.getString("completed_at"),
        image.getString("name"),
        image.getString("tag"),
        getStatus(doc, metadata),
        vulnIds,
        metadata);
  }

  private String getStatus(Document doc, Map<String, String> metadata) {
    if (doc.containsKey("error")) {
      var error = doc.get("error", Document.class);
      if (error.getString("type").equals("expired")) {
        return "expired";
      }
      return "failed";
    }
    var input = doc.get("input", Document.class);
    if (input != null) {
      var scan = input.get("scan", Document.class);
      if (scan.getString("completed_at") != null) {
        return "completed";
      }
    }
    if (metadata != null) {
      if (metadata.get(SENT_AT) != null) {
        return "sent";
      }
      if (metadata.get(SUBMITTED_AT) != null) {
        return "queued";
      }
      if (metadata.get(PRODUCT_ID) != null) {
        return "pending";
      }
    }

    return "unknown";
  }

  public void updateWithOutput(List<String> ids, JsonNode report)
      throws JsonMappingException, JsonProcessingException {
    
    Set<String> productIds = getProductId(ids);
    
    List<Document> outputDocs = objectMapper.readValue(report.get("output").toPrettyString(),
        new TypeReference<List<Document>>() {

        });
    var scan = report.get("input").get("scan").toPrettyString();
    var info = report.get("info").toPrettyString();
    var updates = Updates.combine(Updates.set("input.scan", Document.parse(scan)),
        Updates.set("info", Document.parse(info)),
        Updates.set("output", outputDocs),
        Updates.unset("error"));
    var bulk = ids.stream()
        .map(id -> new UpdateOneModel<Document>(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id)), updates))
        .toList();
    getCollection().bulkWrite(bulk);
    
    productIds.forEach(this::checkAndStoreProductCompletion);
  }

  public void updateWithError(String id, String errorType, String errorMessage) {
    String productId = getProductId(id);  
    
    var error = new Document("type", errorType).append("message", errorMessage);
    getCollection().updateOne(new Document(RepositoryConstants.ID_KEY, new ObjectId(id)), Updates.set("error", error));
    
    if (productId != null) {
      checkAndStoreProductCompletion(productId);
    }
  }

  public Report save(String data) {
    var doc = Document.parse(data);
    var inserted = getCollection().insertOne(doc);
    return get(inserted.getInsertedId().asObjectId().getValue());
  }

  public void setAsSent(String id) {
    var objId = new ObjectId(id);
    getCollection().updateOne(Filters.eq(RepositoryConstants.ID_KEY, objId),
        Updates.set("metadata." + SENT_AT, Instant.now()));
  }

  public void setAsSubmitted(String id, String byUser) {
    var objId = new ObjectId(id);

    List<Bson> updates = new ArrayList<>();
    updates.add(Updates.set("metadata." + SUBMITTED_AT, Instant.now()));
    updates.add(Updates.set("metadata.user", byUser));

    getCollection().updateOne(Filters.eq(RepositoryConstants.ID_KEY, objId), updates);
  }

  public void setAsRetried(String id, String byUser) {
    var objId = new ObjectId(id);
    getCollection().updateOne(Filters.eq(RepositoryConstants.ID_KEY, objId),
        Updates.combine(
            Updates.set("metadata." + SUBMITTED_AT, Instant.now()),
            Updates.set("metadata.user", byUser),
            Updates.unset("error")));
  }

  private Report get(ObjectId id) {
    var doc = getCollection().find(Filters.eq(RepositoryConstants.ID_KEY, id)).first();
    return toReport(doc);
  }

  public String findById(String id) {
    var result = getCollection().find(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id))).first();
    return result.toJson();
  }

  public List<Report> findByName(String name) {
    var results = new ArrayList<Report>();
    getCollection().find(Filters.eq("input.scan.id", name)).cursor().forEachRemaining(d -> results.add(toReport(d)));
    return results;
  }

  private static final Map<String, String> SORT_MAPPINGS = Map.of(
      "completedAt", "input.scan.completed_at",
      "submittedAt", "metadata.submitted_at",
      "name", "input.scan.id",
      "vuln_id", "output.vuln_id");

  public PaginatedResult<Report> list(Map<String, String> queryFilter, List<SortField> sortFields,
      Pagination pagination) {
    List<Report> reports = new ArrayList<>();
    var filter = buildQueryFilter(queryFilter);

    List<Bson> sorts = new ArrayList<>();
    sortFields.forEach(sf -> {
      var fieldName = SORT_MAPPINGS.get(sf.field());
      if (SortType.ASC.equals(sf.type())) {
        sorts.add(Sorts.ascending(fieldName));
      } else {
        sorts.add(Sorts.descending(fieldName));
      }
    });
    
    var totalElements = getCollection().countDocuments(filter);
    int totalPages = (int) Math.ceil((double) totalElements / pagination.size());

    getCollection().find(filter)
        .skip(pagination.page() * pagination.size())
        .sort(Sorts.orderBy(sorts))
        .limit(pagination.size())
        .cursor()
        .forEachRemaining(d -> reports.add(toReport(d)));
    return new PaginatedResult<Report>(totalElements, totalPages, reports.stream());
  }


  public List<String> getProductIds() {
    List<String> productIds = new ArrayList<>();
    Bson filter = Filters.exists("metadata.product_id", true);
    getCollection()
      .distinct("metadata.product_id", filter, String.class)
      .iterator()
      .forEachRemaining(pid -> {
        if (pid != null && !pid.isEmpty()) {
          productIds.add(pid);
        }
      });
    return productIds;
  }

  public ProductReportSummary getProductSummary(String productId) {
    Bson productFilter = Filters.eq("metadata.product_id", productId);
    Map<String, Set<Justification>> cveSet = new HashMap<>();
    String[] productSubmittedAt = {null};
    String[] productCompletedAt = {null};
    String[] productName = {null};
    String[] productVersion = {null};
    Set<String> productStates = new HashSet<>();
    String productState = "unknown";

    getCollection()
      .find(productFilter)
      .iterator()
      .forEachRemaining(doc -> {
        Map<String, String> metadata = extractMetadata(doc);
        
        if (productSubmittedAt[0] == null) {
          String submittedAt = metadata.get("product_submitted_at");
          if (submittedAt != null && !submittedAt.isEmpty()) {
            productSubmittedAt[0] = submittedAt;
          }
        }
        
        if (productCompletedAt[0] == null) {
          String completedAt = metadata.get("product_completed_at");
          if (completedAt != null && !completedAt.isEmpty()) {
            productCompletedAt[0] = completedAt;
          }
        }

        if (productName[0] == null) {
          String name = metadata.get("product_name");
          if (name != null && !name.isEmpty()) {
            productName[0] = name;
          }
        }

        if (productVersion[0] == null) {
          String version = metadata.get("product_version");
          if (version != null && !version.isEmpty()) {
            productVersion[0] = version;
          }
        }

        String reportStatus = getStatus(doc, metadata);
        productStates.add(reportStatus);

        Object inputObj = doc.get("input");
        if (inputObj instanceof org.bson.Document inputDoc) {
          Object scanObj = inputDoc.get("scan");
          if (scanObj instanceof org.bson.Document scanDoc) {
            Object vulnsObj = scanDoc.get("vulns");
            if (vulnsObj instanceof List<?> vulnsList) {
              for (Object vulnObj : vulnsList) {
                if (vulnObj instanceof org.bson.Document vulnDoc) {
                  String cve = vulnDoc.getString("vuln_id");
                  if (cve != null && !cve.isEmpty()) {
                    cveSet.putIfAbsent(cve, new HashSet<>());
                  }
                }
              }
            }
          }
        }

        Object outputObj = doc.get("output");
        if (outputObj instanceof List<?> outputList) {
          for (Object output : outputList) {
            if (output instanceof org.bson.Document outputDoc) {
              String cve = outputDoc.getString("vuln_id");
              if (cve != null && !cve.isEmpty()) {
                Set<Justification> justifications = cveSet.computeIfAbsent(cve, k -> new HashSet<>());
                Object justificationObj = outputDoc.get("justification");
                if (justificationObj instanceof org.bson.Document justificationDoc) {
                  String status = justificationDoc.getString("status");
                  String label = justificationDoc.getString("label");
                  if (status != null && !status.isEmpty() && label != null && !label.isEmpty()) {
                    justifications.add(new Justification(status, label));
                  }
                }
              }
            }
          }
        }
      });

    if (productStates.contains("pending") || productStates.contains("queued") || productStates.contains("sent")) {
      productState = "analysing";
    } else {
      productState = "completed";
    }

    return new ProductReportSummary(productId, productName[0], productVersion[0], productSubmittedAt[0], productCompletedAt[0], productState, cveSet);
  }

  private String getProductId(String reportId) {
    Document doc = getCollection().find(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(reportId))).first();
    if (doc != null) {
      var metadata = doc.get("metadata", Document.class);
      if (metadata != null) {
        return metadata.getString("product_id");
      }
    }
    return null;
  }

  private Set<String> getProductId(Collection<String> reportIds) {
    Set<String> productIds = new HashSet<>();
    reportIds.forEach(id -> {
      String productId = getProductId(id);
      if (productId != null) {
        productIds.add(productId);
      }
    });
    return productIds;
  }

  private void storeProductCompletedAt(String productId, String completedAt) {
    // Update all reports for this product to include product_completed_at in metadata
    Bson productFilter = Filters.eq("metadata.product_id", productId);
    var update = Updates.set("metadata.product_completed_at", completedAt);
    getCollection().updateMany(productFilter, update);
  }

  private void checkAndStoreProductCompletion(String productId) {
    // Check if this product just became completed
    Bson productFilter = Filters.eq("metadata.product_id", productId);
    boolean hasCompletionTimeStored = false;
    boolean hasPendingReports = false;
    String latestCompletionTime = null;

    try (var cursor = getCollection().find(productFilter).cursor()) {
      while (cursor.hasNext()) {
        Document doc = cursor.next();
        Map<String, String> metadata = extractMetadata(doc);
        
        if (metadata.get("product_completed_at") != null) {
          hasCompletionTimeStored = true;
          break;
        }
        
        String reportStatus = getStatus(doc, metadata);
        
        if ("pending".equals(reportStatus) || "queued".equals(reportStatus) || "sent".equals(reportStatus)) {
          hasPendingReports = true;
          break;
        }
        
        if ("completed".equals(reportStatus) || "failed".equals(reportStatus) || "expired".equals(reportStatus)) {
          String completedAt = getReportCompletionTime(doc);
          if (completedAt != null && (latestCompletionTime == null || completedAt.compareTo(latestCompletionTime) > 0)) {
            latestCompletionTime = completedAt;
          }
        }
      }
    }

    if (!hasCompletionTimeStored && !hasPendingReports && latestCompletionTime != null) {
      storeProductCompletedAt(productId, latestCompletionTime);
      LOGGER.infof("Product %s completed at %s", productId, latestCompletionTime);
    }
  }

  private String getReportCompletionTime(Document doc) {
    var input = doc.get("input", Document.class);
    if (input != null) {
      var scan = input.get("scan", Document.class);
      if (scan != null) {
        String completedAt = scan.getString("completed_at");
        if (completedAt != null) {
          return completedAt;
        }
      }
    }
    
    var metadata = extractMetadata(doc);
    String submittedAt = metadata.get("submitted_at");
    return submittedAt;
  }

  public List<String> getReportIdsByProduct(List<String> productIds) {
    List<String> reportIds = new ArrayList<>();
    if (productIds == null || productIds.isEmpty()) {
      return reportIds;
    }
    Bson filter = Filters.in("metadata.product_id", productIds);
    getCollection()
      .find(filter)
      .iterator()
      .forEachRemaining(doc -> {
        ObjectId id = doc.getObjectId(RepositoryConstants.ID_KEY);
        if (id != null) {
          reportIds.add(id.toHexString());
        }
      });
    return reportIds;
  }

  public boolean remove(String id) {
    String productId = getProductId(id);
    
    boolean result = getCollection().deleteOne(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id))).wasAcknowledged();
    
    if (result && productId != null) {
      checkAndStoreProductCompletion(productId);
    }
    
    return result;
  }

  public boolean remove(Collection<String> ids) {
    Set<String> productIds = getProductId(ids);
    
    boolean result = getCollection()
        .deleteMany(Filters.in(RepositoryConstants.ID_KEY, ids.stream()
            .map(id -> new ObjectId(id)).toList()))
        .wasAcknowledged();
    
    if (result) {
      productIds.forEach(this::checkAndStoreProductCompletion);
    }
    
    return result;
  }

  public Collection<String> remove(Map<String, String> queryFilter) {

    var filter = buildQueryFilter(queryFilter);
    Collection collection = new ArrayList();
    MongoCursor<Document> docs = getCollection().find(filter).cursor();
      for (MongoCursor<Document> it = docs; it.hasNext(); ) {
        Document doc = it.next();
        String docInternalId = doc.get(RepositoryConstants.ID_KEY, ObjectId.class).toHexString();
        collection.add(docInternalId);


      }
    getCollection().deleteMany(filter).wasAcknowledged();
    return collection;
  }

  public void removeBefore(Instant threshold) {
    var count = getCollection().deleteMany(Filters.lt("metadata." + SUBMITTED_AT, threshold)).getDeletedCount();
    LOGGER.debugf("Removed %s reports before %s", count, threshold);
  }

  private Bson buildQueryFilter(Map<String, String> queryFilter) {
    List<Bson> filters = new ArrayList<>();
    queryFilter.entrySet().forEach(e -> {

      switch (e.getKey()) {
        case "reportId":
          filters.add(Filters.eq("input.scan.id", e.getValue()));
          break;
        case "vulnId":
          filters.add(Filters.elemMatch("input.scan.vulns", Filters.eq("vuln_id", e.getValue())));
          break;
        case "status":
          var field = e.getValue();
          filters.add(STATUS_FILTERS.get(field));
          break;
        case "imageName":
          filters.add(Filters.eq("input.image.name", e.getValue()));
          break;
        case "imageTag":
          filters.add(Filters.eq("input.image.tag", e.getValue()));
          break;
        default:
          filters.add(Filters.eq(String.format("metadata.%s", e.getKey()), e.getValue()));
          break;

      }
    });
    var filter = Filters.empty();
    if (!filters.isEmpty()) {
      filter = Filters.and(filters);
    }
    return filter;
  }
}
