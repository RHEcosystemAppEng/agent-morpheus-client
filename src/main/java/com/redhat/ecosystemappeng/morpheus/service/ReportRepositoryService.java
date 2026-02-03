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
import java.util.Objects;

import com.mongodb.client.MongoCursor;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import com.redhat.ecosystemappeng.morpheus.model.ProductReportsSummary;

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

  Map<String, String> extractMetadata(Document doc) {
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
    if (Objects.isNull(doc)) {
      return null;
    }
    var input = doc.get("input", Document.class);
    var scan = input.get("scan", Document.class);
    var image = input.get("image", Document.class);
    var output = doc.get("output", Document.class);
    var analysis = Objects.nonNull(output) ? output.getList("analysis", Document.class) : null;
    var metadata = extractMetadata(doc);
    var vulnIds = new HashSet<VulnResult>();
    if (Objects.nonNull(analysis)) {
      analysis.forEach(a -> {
        var vulnId = a.getString("vuln_id");
        var justification = a.get("justification", Document.class);

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

    // Extract git_repo and ref from source_info with type "code" if available
    // If there's only one repository, return it even without type "code"
    String gitRepo = null;
    String ref = null;
    var sourceInfo = image.getList("source_info", Document.class);
    if (Objects.nonNull(sourceInfo) && !sourceInfo.isEmpty()) {
      Document selectedSourceInfo = null;
      // If there's only one repository, use it regardless of type
      if (sourceInfo.size() == 1) {
        selectedSourceInfo = sourceInfo.get(0);
      } else {
        // Otherwise, filter for type "code"
        selectedSourceInfo = sourceInfo.stream()
            .filter(si -> "code".equals(si.getString("type")))
            .findFirst()
            .orElse(null);
      }
      if (Objects.nonNull(selectedSourceInfo)) {
        gitRepo = selectedSourceInfo.getString("git_repo");
        ref = selectedSourceInfo.getString("ref");
      }
    }
    LOGGER.infof("gitRepo: %s, ref: %s", gitRepo, ref);
    return new Report(id, scan.getString(RepositoryConstants.ID_SORT),
        scan.getString("started_at"),
        scan.getString("completed_at"),
        image.getString("name"),
        image.getString("tag"),
        getStatus(doc, metadata),
        vulnIds,
        metadata,
        gitRepo,
        ref);
  }

  String getStatus(Document doc, Map<String, String> metadata) {
    if (doc.containsKey("error")) {
      var error = doc.get("error", Document.class);
      if (error.getString("type").equals("expired")) {
        return "expired";
      }
      return "failed";
    }
    var input = doc.get("input", Document.class);
    if (Objects.nonNull(input)) {
      var scan = input.get("scan", Document.class);
      if (Objects.nonNull(scan.getString("completed_at"))) {
        return "completed";
      }
    }
    if (Objects.nonNull(metadata)) {
      if (Objects.nonNull(metadata.get(SENT_AT))) {
        return "sent";
      }
      if (Objects.nonNull(metadata.get(SUBMITTED_AT))) {
        return "queued";
      }
      if (Objects.nonNull(metadata.get(PRODUCT_ID))) {
        return "pending";
      }
    }

    return "unknown";
  }

  public void updateWithOutput(List<String> ids, JsonNode report)
      throws JsonMappingException, JsonProcessingException {
    
    
    Document outputDoc = objectMapper.readValue(report.get("output").toPrettyString(), Document.class);
    var scan = report.get("input").get("scan").toPrettyString();
    var info = report.get("info").toPrettyString();
    var updates = Updates.combine(Updates.set("input.scan", Document.parse(scan)),
        Updates.set("info", Document.parse(info)),
        Updates.set("output", outputDoc),
        Updates.unset("error"));
    var bulk = ids.stream()
        .map(id -> new UpdateOneModel<Document>(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id)), updates))
        .toList();
    getCollection().bulkWrite(bulk);
    
  }

  public void updateWithError(String id, String errorType, String errorMessage) {
    
    var error = new Document("type", errorType).append("message", errorMessage);
    getCollection().updateOne(new Document(RepositoryConstants.ID_KEY, new ObjectId(id)), Updates.set("error", error));
    
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
    if (result == null) {
      return null;
    }
    try {
      // Extract metadata and calculate state
      var metadata = extractMetadata(result);
      var state = getStatus(result, metadata);
      
      // Parse JSON, add state field, and serialize back
      var jsonString = result.toJson();
      var jsonNode = objectMapper.readTree(jsonString);
      ((com.fasterxml.jackson.databind.node.ObjectNode) jsonNode).put("state", state);
      return objectMapper.writeValueAsString(jsonNode);
    } catch (JsonProcessingException e) {
      LOGGER.errorf("Error adding state to report JSON for id %s: %s", id, e.getMessage());
      // Fallback to original JSON if parsing fails
      return result.toJson();
    }
  }

  public List<Report> findByName(String name) {
    var results = new ArrayList<Report>();
    getCollection().find(Filters.eq("input.scan.id", name)).cursor().forEachRemaining(d -> results.add(toReport(d)));
    return results;
  }

  private static final Map<String, String> SORT_MAPPINGS = Map.of(
      "completedAt", "input.scan.completed_at",
      "submittedAt", "metadata.submitted_at",
      "vuln_id", "output.analysis.vuln_id",
      "ref", "input.image.source_info.ref",
      "gitRepo", "input.image.source_info.git_repo");

  public PaginatedResult<Report> list(Map<String, String> queryFilter, List<SortField> sortFields,
      Pagination pagination) {
    List<Report> reports = new ArrayList<>();
    var filter = buildQueryFilter(queryFilter);

    List<Bson> sorts = new ArrayList<>();
    sortFields.forEach(sf -> {
       {
          var fieldName = SORT_MAPPINGS.get(sf.field());
          if (fieldName != null) {
            if (SortType.ASC.equals(sf.type())) {
              sorts.add(Sorts.ascending(fieldName));
            } else {
              sorts.add(Sorts.descending(fieldName));
            }
          }
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


  public List<String> getReportIdsByProduct(List<String> productIds) {
    List<String> reportIds = new ArrayList<>();
    if (Objects.isNull(productIds) || productIds.isEmpty()) {
      return reportIds;
    }
    Bson filter = Filters.in("metadata.product_id", productIds);
    getCollection()
      .find(filter)
      .iterator()
      .forEachRemaining(doc -> {
        ObjectId id = doc.getObjectId(RepositoryConstants.ID_KEY);
        if (Objects.nonNull(id)) {
          reportIds.add(id.toHexString());
        }
      });
    return reportIds;
  }

  public boolean remove(String id) {
    
    boolean result = getCollection().deleteOne(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id))).wasAcknowledged();    
    return result;
  }

  public boolean remove(Collection<String> ids) {
    
    boolean result = getCollection()
        .deleteMany(Filters.in(RepositoryConstants.ID_KEY, ids.stream()
            .map(id -> new ObjectId(id)).toList()))
        .wasAcknowledged();
    
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

  private void handleMultipleValues(String valueString, 
                                     java.util.function.Function<String, Bson> filterBuilder,
                                     List<Bson> filters) {
    String[] values = valueString.split(",");
    if (values.length == 1) {
      filters.add(filterBuilder.apply(values[0].trim()));
    } else {
      List<Bson> valueFilters = new ArrayList<>();
      for (String value : values) {
        valueFilters.add(filterBuilder.apply(value.trim()));
      }
      filters.add(valueFilters.size() == 1 ? valueFilters.get(0) : Filters.or(valueFilters));
    }
  }

  private Bson buildQueryFilter(Map<String, String> queryFilter) {
    List<Bson> filters = new ArrayList<>();
    String vulnId = queryFilter.get("vulnId");
    String exploitIqStatus = queryFilter.get("exploitIqStatus");
    
    queryFilter.entrySet().forEach(e -> {

      switch (e.getKey()) {
        case "reportId":
          handleMultipleValues(e.getValue(), (value) -> 
            Filters.eq("input.scan.id", value), filters);
          break;
        case "vulnId":
          handleMultipleValues(e.getValue(), (value) -> 
            Filters.elemMatch("input.scan.vulns", Filters.eq("vuln_id", value)), filters);
          break;
        case "status":
          var statusValues = e.getValue().split(",");
          if (statusValues.length == 1) {
            var statusFilter = STATUS_FILTERS.get(statusValues[0].trim());
            if (statusFilter != null) {
              filters.add(statusFilter);
            }
          } else {
            List<Bson> statusFilters = new ArrayList<>();
            for (String statusValue : statusValues) {
              var statusFilter = STATUS_FILTERS.get(statusValue.trim());
              if (statusFilter != null) {
                statusFilters.add(statusFilter);
              }
            }
            if (!statusFilters.isEmpty()) {
              filters.add(Filters.or(statusFilters));
            }
          }
          break;
        case "imageName":
          handleMultipleValues(e.getValue(), (value) -> 
            Filters.eq("input.image.name", value), filters);
          break;
        case "imageTag":
          handleMultipleValues(e.getValue(), (value) -> 
            Filters.eq("input.image.tag", value), filters);
          break;
        case "productId":
          handleMultipleValues(e.getValue(), (value) -> 
            Filters.eq("metadata.product_id", value), filters);
          break;
        case "gitRepo":
          var gitRepoValues = e.getValue().split(",");
          if (gitRepoValues.length == 1) {
            filters.add(Filters.elemMatch("input.image.source_info", 
              Filters.and(
                Filters.eq("type", "code"),
                Filters.regex("git_repo", gitRepoValues[0].trim(), "i")
              )
            ));
          } else {
            List<Bson> gitRepoFilters = new ArrayList<>();
            for (String gitRepoValue : gitRepoValues) {
              gitRepoFilters.add(Filters.elemMatch("input.image.source_info", 
                Filters.and(
                  Filters.eq("type", "code"),
                  Filters.regex("git_repo", gitRepoValue.trim(), "i")
                )
              ));
            }
            filters.add(Filters.or(gitRepoFilters));
          }
          break;
        case "exploitIqStatus":
          break;
        default:
          handleMultipleValues(e.getValue(), (value) -> 
            Filters.eq(String.format("metadata.%s", e.getKey()), value), filters);
          break;

      }
    });
    
    if (exploitIqStatus != null && !exploitIqStatus.isEmpty()) {
      String[] exploitIqStatusValues = exploitIqStatus.split(",");
      List<Bson> exploitIqStatusFilters = new ArrayList<>();
      
      for (String statusValue : exploitIqStatusValues) {
        String trimmedStatus = statusValue.trim();
        if (vulnId != null && !vulnId.isEmpty()) {
          exploitIqStatusFilters.add(Filters.elemMatch("output.analysis", 
            Filters.and(
              Filters.eq("vuln_id", vulnId),
              Filters.eq("justification.status", trimmedStatus)
            )
          ));
        } else {
          exploitIqStatusFilters.add(Filters.elemMatch("output.analysis", 
            Filters.eq("justification.status", trimmedStatus)
          ));
        }
      }
      
      if (!exploitIqStatusFilters.isEmpty()) {
        filters.add(exploitIqStatusFilters.size() == 1 
          ? exploitIqStatusFilters.get(0) 
          : Filters.or(exploitIqStatusFilters));
      }
    }
    var filter = Filters.empty();
    if (!filters.isEmpty()) {
      filter = Filters.and(filters);
    }
    return filter;
  }
}
