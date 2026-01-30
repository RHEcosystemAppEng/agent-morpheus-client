package com.redhat.ecosystemappeng.morpheus.repository;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Indexes;
import jakarta.annotation.PostConstruct;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import jakarta.validation.constraints.NotEmpty;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Singleton
public class EvalRepositoryService extends AuditRepository {

    @Inject
    MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    private MongoCollection<Document> getEvalsCollection() {
        return mongoClient.getDatabase(dbName).getCollection(EVALS_COLLECTION);
    }

    public void removeAllEvalsOfJob(@NotEmpty String jobId) {
    }

    public void removeAllEvalsOfJobAndTrace(@NotEmpty String jobId, String traceId) {
        
    }

    public List<String> findAll() {
        return null;
    }

    public List<String> findEvalsByJobAndTraceId(String jobId, String traceId) {
        return null;
    }

    public List<String> findEvalsByJobId(String jobId) {
        return null;
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

    @PostConstruct
    public void dbInit() {
        MongoCollection<Document> jobsCollection = getEvalsCollection();
        jobsCollection.createIndex(Indexes.ascending(JOB_ID_FIELD_NAME));
        jobsCollection.createIndex(Indexes.ascending(JOB_ID_FIELD_NAME, TRACE_ID_FIELD_NAME));
        jobsCollection.createIndex(Indexes.ascending(CVE_FIELD_NAME, COMPONENT_FIELD_NAME, COMPONENT_VERSION_FIELD_NAME));
        jobsCollection.createIndex(Indexes.ascending(CVE_FIELD_NAME, COMPONENT_FIELD_NAME, COMPONENT_VERSION_FIELD_NAME, METRIC_NAME_FIELD_NAME));

    }
}
