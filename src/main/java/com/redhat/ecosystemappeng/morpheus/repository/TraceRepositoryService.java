package com.redhat.ecosystemappeng.morpheus.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Indexes;
import com.redhat.ecosystemappeng.morpheus.model.audit.Trace;
import jakarta.annotation.PostConstruct;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import jakarta.validation.constraints.NotEmpty;
import org.bson.Document;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Singleton
public class TraceRepositoryService extends AuditRepository {

    private static final Logger LOGGER = Logger.getLogger(TraceRepositoryService.class);
    @Inject
    MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    private MongoCollection<Document> getTracesCollection() {
        return mongoClient.getDatabase(dbName).getCollection(TRACES_COLLECTION);
    }

    public void removeAllTracesOfJob(@NotEmpty String jobId) {
        getTracesCollection().deleteMany(Filters.eq(JOB_ID_FIELD_NAME, jobId));
    }

    public void removeAllTracesOfJobAndTrace(@NotEmpty String jobId, String traceId) {
        getTracesCollection().deleteMany(Filters.and(Filters.eq(JOB_ID_FIELD_NAME, jobId), Filters.eq(TRACE_ID_FIELD_NAME, traceId)));
    }

    public List<String> findAll() {
        ArrayList<Document> tracesResult = new ArrayList<>();
        getTracesCollection().find().into(tracesResult);
        if (tracesResult.isEmpty()) {
            return null;
        }
        else {
            return transformToJsonsList(tracesResult);
        }

    }

    public List<String> findTracesByJobAndTraceId(String jobId, String traceId) {
        ArrayList<Document> tracesResult = new ArrayList<>();
        getTracesCollection().find(Filters.and(Filters.eq(JOB_ID_FIELD_NAME, jobId),
                                               Filters.eq(TRACE_ID_FIELD_NAME, traceId))).into(tracesResult);
        if (tracesResult.isEmpty()) {
            return List.of();
        }
        else {
            return transformToJsonsList(tracesResult);
        }

    }

    public List<String> findTracesByJobId(String jobId) {
        ArrayList<Document> tracesResult = new ArrayList<>();
        getTracesCollection().find(Filters.eq(JOB_ID_FIELD_NAME, jobId)).into(tracesResult);
        if (tracesResult.isEmpty()) {
            return List.of();
        }
        else {
            return transformToJsonsList(tracesResult);
        }
    }


    public void saveMany(List<Trace> traces) {

        List<Document> documentsToBeSaved = traces.parallelStream().map(this::traceToDocument).filter(Objects::nonNull).toList();
        getTracesCollection().insertMany(documentsToBeSaved);
    }

    private Document traceToDocument(Trace trace) {
        String traceJson = null;
        try {
            traceJson = this.mapper.writeValueAsString(trace);
        } catch (JsonProcessingException e) {
            LOGGER.warnf("Failed to serialize trace object %s to JSON string: %s", trace.toString(), e.getMessage());
            throw new RuntimeException("Failed to serialize Trace => " + trace, e);
        }
        return Document.parse(traceJson);
    }


    @PostConstruct
    public void dbInit() {
        MongoCollection<Document> tracesCollection = getTracesCollection();
        tracesCollection.createIndex(Indexes.descending(EXECUTION_START_TIMESTAMP));
        tracesCollection.createIndex(Indexes.ascending(JOB_ID_FIELD_NAME));
        tracesCollection.createIndex(Indexes.ascending(JOB_ID_FIELD_NAME, TRACE_ID_FIELD_NAME));
    }
}
