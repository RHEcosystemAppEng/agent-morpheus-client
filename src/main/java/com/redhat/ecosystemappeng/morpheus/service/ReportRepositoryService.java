package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.redhat.ecosystemappeng.morpheus.model.Justification;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.Report;
import com.redhat.ecosystemappeng.morpheus.model.SortField;
import com.redhat.ecosystemappeng.morpheus.model.SortType;
import com.redhat.ecosystemappeng.morpheus.model.VulnResult;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ReportRepositoryService {

  private static final String COLLECTION = "reports";

  @Inject
  MongoClient mongoClient;

  @ConfigProperty(name = "quarkus.mongodb.database")
  String dbName;

  @Inject
  ObjectMapper mapper;

  private MongoCollection<Document> geCollection() {
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
    var vulnIds = new HashSet<VulnResult>();
    output.forEach(o -> {
      var vulnId = o.getString("vuln_id");
      var justification = o.get("justification", Document.class);

      vulnIds.add(new VulnResult(vulnId,
          new Justification(justification.getString("status"), justification.getString("label"))));
    });
    var id = doc.get(RepositoryConstants.ID_KEY, ObjectId.class).toHexString();

    return new Report(id, scan.getString(RepositoryConstants.ID_SORT), scan.getString("completed_at"), image.getString("name"),
        image.getString("tag"), vulnIds);
  }

  public Report save(String data) throws IOException {
    var doc = Document.parse(data);
    var inserted = geCollection().insertOne(doc);
    return get(inserted.getInsertedId().asObjectId().getValue());
  }

  private Report get(ObjectId id) {
    var doc = geCollection().find(Filters.eq(RepositoryConstants.ID_KEY, id)).first();
    return toReport(doc);
  }

  public String findById(String id) {
    var result = geCollection().find(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id))).first();
    return result.toJson();
  }

  public List<Report> findByName(String name) {
    var results = new ArrayList<Report>();
    geCollection().find(Filters.eq("input.scan.id", name)).cursor().forEachRemaining(d -> results.add(toReport(d)));
    return results;
  }

  private static final Map<String, String> SORT_MAPPINGS = Map.of(
    "completedAt", "input.scan.completed_at",
    "name", "input.scan.id",
    "image_name", "input.image.name",
    "image_tag", "input.image.tag",
    "vuln_id", "output.vuln_id",
    "justification_status", "output.justification.status",
    "justification_label", "output.justification.label"
  );

  public PaginatedResult<Report> list(String vulnId, List<SortField> sortFields, Pagination pagination) {
    List<Report> reports = new ArrayList<>();
    Bson filter = Filters.empty();
    if(vulnId != null) {
      filter = Filters.in("output.vuln_id", vulnId);
    }

    List<Bson> sorts = new ArrayList<>();
    sortFields.forEach(sf -> {
      var fieldName = SORT_MAPPINGS.get(sf.field());
      if(SortType.ASC.equals(sf.type())) {
        sorts.add(Sorts.ascending(fieldName));
      } else {
        sorts.add(Sorts.descending(fieldName));
      }
    });

    var totalElements = geCollection().countDocuments(filter);
    int totalPages = (int) Math.ceil((double) totalElements / pagination.size());

    geCollection().find(filter)
        .skip(pagination.page() * pagination.size())
        .sort(Sorts.orderBy(sorts))
        .limit(pagination.size())
        .cursor()
        .forEachRemaining(d -> reports.add(toReport(d)));
    return new PaginatedResult<Report>(totalElements, totalPages, reports.stream());
  }

  public boolean remove(String id) {
    return geCollection().deleteOne(Filters.eq(RepositoryConstants.ID_KEY, new ObjectId(id))).wasAcknowledged();
  }
}
