package com.redhat.ecosystemappeng.morpheus.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

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

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
@RegisterForReflection(targets = { Document.class })
public class ReportRepositoryService {

  private static final Logger LOGGER = Logger.getLogger(ReportRepositoryService.class);

  private static final String SENT_AT = "sent_at";
  private static final String SUBMITTED_AT = "submitted_at";
  private static final Collection<String> METADATA_DATES = List.of(SUBMITTED_AT, SENT_AT);
  private static final String COLLECTION = "reports";
  private static final Map<String, Bson> STATUS_FILTERS = Map.of(
      "completed", Filters.ne("input.scan.completed_at", null),
      "sent",
      Filters.and(Filters.ne("metadata." + SENT_AT, null), Filters.eq("error", null),
          Filters.eq("input.scan.completed_at", null)),
      "failed", Filters.ne("error", null),
      "queued", Filters.and(Filters.ne("metadata." + SUBMITTED_AT, null), Filters.eq("metadata." + SENT_AT, null),
          Filters.eq("error", null), Filters.eq("input.scan.completed_at", null)));

  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @Inject
  ObjectMapper objectMapper;

  public MongoCollection<Document> getCollection() {
    return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
  }

  public Report toReport(Document doc) {
    if (doc == null) {
      return null;
    }
    var input = doc.get("input", Document.class);
    var scan = input.get("scan", Document.class);
    var image = input.get("image", Document.class);
    var output = doc.getList("output", Document.class);
    var metadataField = doc.get("metadata", Document.class);
    var metadata = new HashMap<String, String>();
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
      if (error.getString("type").equals("timeout")) {
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
    }

    return "unknown";
  }

  public void updateWithOutput(List<String> ids, JsonNode report)
      throws JsonMappingException, JsonProcessingException {
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
    getCollection().updateOne(Filters.eq(RepositoryConstants.ID_KEY, objId),
        List.of(
            Updates.set("metadata." + SUBMITTED_AT, Instant.now()),
            Updates.set("metadata.user", byUser)));
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

  public boolean remove(String id) {
    return getCollection().deleteOne(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id))).wasAcknowledged();
  }

  public boolean remove(Collection<String> ids) {
    return getCollection()
        .deleteMany(Filters.in(RepositoryConstants.ID_KEY, ids.stream()
            .map(id -> new ObjectId(id)).toList()))
        .wasAcknowledged();
  }

  public boolean remove(Map<String, String> queryFilter) {

    var filter = buildQueryFilter(queryFilter);
    return getCollection().deleteMany(filter).wasAcknowledged();
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
