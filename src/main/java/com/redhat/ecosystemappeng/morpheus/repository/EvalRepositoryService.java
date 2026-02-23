package com.redhat.ecosystemappeng.morpheus.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Indexes;
import com.redhat.ecosystemappeng.morpheus.model.audit.Eval;
import jakarta.annotation.PostConstruct;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import jakarta.validation.constraints.NotEmpty;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Singleton
public class EvalRepositoryService extends AuditRepository {

    private static final Logger LOGGER = Logger.getLogger(EvalRepositoryService.class);
    @Inject
    MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    private MongoCollection<Document> getEvalsCollection() {
        return mongoClient.getDatabase(dbName).getCollection(EVALS_COLLECTION);
    }

    public void removeAllEvalsOfJob(@NotEmpty String jobId) {
        getEvalsCollection().deleteMany(Filters.eq(JOB_ID_FIELD_NAME, jobId));
    }

    public void removeAllEvalsOfJobAndTrace(@NotEmpty String jobId, String traceId) {
        getEvalsCollection().deleteMany(Filters.and(Filters.eq(JOB_ID_FIELD_NAME, jobId), Filters.eq(TRACE_ID_FIELD_NAME, traceId)));
    }

    public List<String> findAll() {
        ArrayList<Document> evalsResult = new ArrayList<>();
        getEvalsCollection().find().into(evalsResult);
        if (evalsResult.isEmpty()) {
            return null;
        }
        else {
            return transformToJsonsList(evalsResult);
        }

    }

    public List<String> findEvalsByJobAndTraceId(String jobId, String traceId) {
        ArrayList<Document> evalsResult = new ArrayList<>();
        getEvalsCollection().find(Filters.and(Filters.eq(JOB_ID_FIELD_NAME, jobId),
                                              Filters.eq(TRACE_ID_FIELD_NAME, traceId))).into(evalsResult);
        if (evalsResult.isEmpty()) {
            return List.of();
        }
        else {
            return transformToJsonsList(evalsResult);
        }

    }

    public List<String> findEvalsByJobId(String jobId) {
        ArrayList<Document> evalsResult = new ArrayList<>();
        getEvalsCollection().find(Filters.eq(JOB_ID_FIELD_NAME, jobId)).into(evalsResult);
        if (evalsResult.isEmpty()) {
            return List.of();
        }
        else {
            return transformToJsonsList(evalsResult);
        }
    }

    public List<String> findCveAndApplicationEvals(String cveId, String component, String componentVersion, String metricName) {
        ArrayList<Document> evals = new ArrayList<>();
        Bson queryFilter;
        Bson cveFilter = Filters.eq(CVE_FIELD_NAME, cveId);
        Bson componentFilter = Filters.eq(COMPONENT_FIELD_NAME, component);
        Bson componentVersionFilter = Filters.eq(COMPONENT_VERSION_FIELD_NAME, componentVersion);
        Bson metricNameFilter = Filters.eq(METRIC_NAME_FIELD_NAME, metricName);
        if(Objects.nonNull(metricName) && !metricName.isEmpty()) {

            queryFilter = Filters.and(cveFilter, componentFilter, componentVersionFilter, metricNameFilter);
        }
        else {
            queryFilter = Filters.and(cveFilter, componentFilter, componentVersionFilter);
        }


        getEvalsCollection().find(queryFilter).into(evals);
        return this.transformToJsonsList(evals);
    }

    public void saveMany(List<Eval> evals) {

        List<Document> documentsToBeSaved = evals.parallelStream().map(this::evalToDocument).filter(Objects::nonNull).toList();
        getEvalsCollection().insertMany(documentsToBeSaved);
    }

    private Document evalToDocument(Eval eval) {
        String evalJson = null;
        try {
            evalJson = this.mapper.writeValueAsString(eval);
        } catch (JsonProcessingException e) {
            LOGGER.warnf("Failed to serialize eval object %s to JSON string: %s", eval.toString(), e.getMessage());
            throw new RuntimeException("Failed to serialize Eval => " + eval, e);
        }
        return Document.parse(evalJson);
    }


    @PostConstruct
    public void dbInit() {
        MongoCollection<Document> evalsCollection = getEvalsCollection();
        evalsCollection.createIndex(Indexes.descending(EXECUTION_START_TIMESTAMP));
        evalsCollection.createIndex(Indexes.ascending(JOB_ID_FIELD_NAME));
        evalsCollection.createIndex(Indexes.ascending(JOB_ID_FIELD_NAME, TRACE_ID_FIELD_NAME));
        evalsCollection.createIndex(Indexes.ascending(CVE_FIELD_NAME, COMPONENT_FIELD_NAME, COMPONENT_VERSION_FIELD_NAME));
        evalsCollection.createIndex(Indexes.ascending(CVE_FIELD_NAME, COMPONENT_FIELD_NAME, COMPONENT_VERSION_FIELD_NAME, METRIC_NAME_FIELD_NAME));

    }
}
