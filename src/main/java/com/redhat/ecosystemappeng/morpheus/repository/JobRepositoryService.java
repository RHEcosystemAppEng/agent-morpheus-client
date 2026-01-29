package com.redhat.ecosystemappeng.morpheus.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Indexes;
import com.redhat.ecosystemappeng.morpheus.model.audit.Job;
import com.redhat.ecosystemappeng.morpheus.service.audit.JobService;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.annotation.PostConstruct;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING;

@Singleton
@RegisterForReflection(targets = { Document.class })
public class JobRepositoryService extends AuditRepository {

    private static final Logger LOGGER = Logger.getLogger(JobRepositoryService.class);
    @Inject
    MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    public void save(String job) {
        Document document = Document.parse(job);
        getJobsCollection().insertOne(document);
    }

    public void saveMany(List<Job> jobs) {

        List<Document> documentsToBeSaved = jobs.parallelStream().map(this::jobToDocument).filter(Objects::nonNull).toList();
        getJobsCollection().insertMany(documentsToBeSaved);
    }

    private Document jobToDocument(Job job) {
        String jobJson = null;
        try {
            jobJson = this.mapper.writeValueAsString(job);
        } catch (JsonProcessingException e) {
            LOGGER.warnf("Failed to serialize job %s to JSON: %s", job.getJobId(), e.getMessage());
            throw new RuntimeException("Failed to serialize job " + job.getJobId(), e);
        }
        return Document.parse(jobJson);
    }


    public String findById(String id) {
        MongoCollection<Document> collection = getJobsCollection();
        Document jobDoc = collection.find(Filters.eq(INTERNAL_COLLECTION_ID, new ObjectId(id))).first();
        if (Objects.nonNull(jobDoc)) {
            return jobDoc.toJson();
        }
        else {
            return null;
        }
    }

    public String findByJobId(String jobId) {
        MongoCollection<Document> collection = getJobsCollection();
        Document jobDoc = collection.find(Filters.eq(JOB_ID_FIELD_NAME, jobId )).first();
        if (Objects.nonNull(jobDoc)) {
            return jobDoc.toJson();
        }
        else {
            return null;
        }
    }

    public List<String> findAll() {
        List<Document> docs = new ArrayList<>();
        getJobsCollection().find().into(docs);
        if (docs.isEmpty()) {
            return null;
        }
        else {
            return transformToJsonsList(docs);
        }


    }

    public void removeById(String id) {
        MongoCollection<Document> collection = getJobsCollection();
        collection.deleteOne(Filters.eq(INTERNAL_COLLECTION_ID, new ObjectId(id)));
    }

    public void removeByJobId(String id) {
        MongoCollection<Document> collection = getJobsCollection();
        collection.deleteOne(Filters.eq(JOB_ID_FIELD_NAME, id));
    }

    public void removeMany(List<String> ids) {
        this.getJobsCollection().deleteMany(Filters.in(INTERNAL_COLLECTION_ID, ids));
    }

    public void removeManyJobsIds(List<String> ids) {
        this.getJobsCollection().deleteMany(Filters.in(JOB_ID_FIELD_NAME, ids));
    }


    public List<String> findAllJobsByCve(String cve) {
        List<Document> jobsOfCve = new ArrayList<>();
        getJobsCollection().find(Filters.eq(CVE_FIELD_NAME, cve)).into(jobsOfCve);
        if (jobsOfCve.isEmpty()) {
            return null;
        }
        else {
            return transformToJsonsList(jobsOfCve);
        }


    }


    public List<String> findAllJobsByCveAndComponent(String cve, String component, String version) {
        List<Document> jobsOfCertainScan = new ArrayList<>();
        getJobsCollection().find(Filters.and(Filters.eq(CVE_FIELD_NAME, cve), Filters.eq(COMPONENT_FIELD_NAME, component), Filters.eq(COMPONENT_VERSION_FIELD_NAME, version))).into(jobsOfCertainScan);
        if (jobsOfCertainScan.isEmpty()) {
            return null;
        }
        else {
            return transformToJsonsList(jobsOfCertainScan);
        }

    }



    private static List<String> transformToJsonsList(List<Document> docs) {
        if (docs.size() >= THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING) {
            return docs.parallelStream().map(Document::toJson).collect(Collectors.toList());
        }
        else{
            return docs.stream().map(Document::toJson).collect(Collectors.toList());
        }

    }


    @PostConstruct
    public void dbInit() {
        MongoCollection<Document> jobsCollection = getJobsCollection();
        jobsCollection.createIndex(Indexes.ascending(JOB_ID_FIELD_NAME));
        jobsCollection.createIndex(Indexes.ascending(BATCH_ID_FIELD_NAME));
        jobsCollection.createIndex(Indexes.ascending(CVE_FIELD_NAME, COMPONENT_FIELD_NAME, COMPONENT_VERSION_FIELD_NAME));
        jobsCollection.createIndex(Indexes.ascending(CVE_FIELD_NAME));
    }

    private MongoCollection<Document> getJobsCollection() {
        return mongoClient.getDatabase(dbName).getCollection(JOBS_COLLECTION);
    }


    public List<String> findAllJobsByBatchId(String batchId) {
        List<Document> allBatchJobs = new ArrayList<>();
        this.getJobsCollection().find(Filters.eq(BATCH_ID_FIELD_NAME, batchId)).into(allBatchJobs);
        if (allBatchJobs.isEmpty()) {
            return null;
        }
        else{
            return transformToJsonsList(allBatchJobs);
        }

    }
}
