package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;

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
@RegisterForReflection(targets = {Document.class})
public class ReportRepositoryService {

  private static final String COLLECTION = "reports";

  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @Inject
  ObjectMapper objectMapper;

  private MongoCollection<Document> getCollection() {
    return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
  }

  private Report toReport(Document doc) {
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
      metadataField.keySet().forEach(key -> metadata.put(key, metadataField.getString(key)));
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

    return new Report(id, scan.getString(RepositoryConstants.ID_SORT), scan.getString("completed_at"),
        image.getString("name"),
        image.getString("tag"), vulnIds,
        metadata);
  }

  public List<String> updateWithOutput(List<String> ids, JsonNode report)
      throws JsonMappingException, JsonProcessingException {
    List<Document> outputDocs = objectMapper.readValue(report.get("output").toPrettyString(), new TypeReference<List<Document>>() {

    });
    var scan = report.get("input").get("scan").toPrettyString();
    var info = report.get("info").toPrettyString();
    var updates = Updates.combine(Updates.set("input.scan", Document.parse(scan)), Updates.set("info", Document.parse(info)),
        Updates.set("output", outputDocs));
    var bulk = ids.stream()
        .map(id -> new UpdateOneModel<Document>(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id)), updates))
        .toList();
    getCollection().bulkWrite(bulk);
    return ids;

  }

  public List<String> updateWithError(String scanId, String errorType, String errorMessage) {
    var reports = findByName(scanId);
    var ids = new ArrayList<String>();
    var error = new Document("type", errorType).append("message", errorMessage);
    var updates = Updates.set("error", error);
    var bulk = reports.stream().map(r -> {
      ids.add(r.id());
      return new UpdateOneModel<Document>(new Document(RepositoryConstants.ID_KEY, r.id()), updates);
    }).toList();
    getCollection().bulkWrite(bulk);
    return ids;
  }

  public Report save(String data) throws IOException {
    var doc = Document.parse(data);
    var inserted = getCollection().insertOne(doc);
    return get(inserted.getInsertedId().asObjectId().getValue());
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
      "image_name", "input.image.name",
      "image_tag", "input.image.tag",
      "vuln_id", "output.vuln_id",
      "justification_status", "output.justification.status",
      "justification_label", "output.justification.label");

  public PaginatedResult<Report> list(Map<String, String> queryFilter, List<SortField> sortFields,
      Pagination pagination) {
    List<Report> reports = new ArrayList<>();
    List<Bson> filters = new ArrayList<>();
    queryFilter.entrySet().forEach(e -> {
      switch (e.getKey()) {
        case "reportId":
          filters.add(Filters.eq("input.scan.id", e.getValue()));
          break;
        case "vulnId":
          filters.add(Filters.elemMatch("input.scan.vulns", Filters.eq("vuln_id", e.getValue())));
          break;
        case "completed":
          if(Boolean.parseBoolean(e.getValue())) {
            filters.add(Filters.ne("input.scan.completed_at", null));
          } else {
            filters.add(Filters.eq("input.scan.completed_at", null));
          }
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
}
