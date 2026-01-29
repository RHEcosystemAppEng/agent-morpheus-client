package com.redhat.ecosystemappeng.morpheus.repository;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.Sorts;
import com.redhat.ecosystemappeng.morpheus.model.audit.BatchType;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.annotation.PostConstruct;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Singleton
@RegisterForReflection(targets = { Document.class })
public class BatchRepositoryService extends AuditRepository {


    @Inject
    MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    public void save(String batch) {
        Document document = Document.parse(batch);
        getBatchesCollection().insertOne(document);
    }

    public String findById(String id) {
        MongoCollection<Document> collection = getBatchesCollection();
        Document jobDoc = collection.find(Filters.eq(INTERNAL_COLLECTION_ID, new ObjectId(id))).first();
        if (Objects.nonNull(jobDoc)) {
            return jobDoc.toJson();
        }
        else {
            return null;
        }
    }

    public String findByBatchId(String batchId) {
        MongoCollection<Document> collection = getBatchesCollection();
        Document jobDoc = collection.find(Filters.eq(BATCH_ID_FIELD_NAME, batchId )).first();
        if (Objects.nonNull(jobDoc)) {
            return jobDoc.toJson();
        }
        else {
            return null;
        }
    }

    public List<String> findAll() {
        List<Document> docs = new ArrayList<>();
        getBatchesCollection().find().into(docs);
        return transformToJsonsList(docs);

    }

    public void removeById(String id) {
        MongoCollection<Document> collection = getBatchesCollection();
        collection.deleteOne(Filters.eq(INTERNAL_COLLECTION_ID, new ObjectId(id)));
    }

    public boolean removeByBatchId(String id) {
        MongoCollection<Document> collection = getBatchesCollection();
        Document deletedDocument = collection.findOneAndDelete(Filters.eq(BATCH_ID_FIELD_NAME, id));

        return Objects.nonNull(deletedDocument);

    }

    public void removeMany(List<String> ids) {
        this.getBatchesCollection().deleteMany(Filters.in(INTERNAL_COLLECTION_ID, ids));
    }

    public void removeManyBatchIds(List<String> ids) {
        this.getBatchesCollection().deleteMany(Filters.in(BATCH_ID_FIELD_NAME, ids));
    }

    public List<String> findAllBatchesByLanguage(String language) {
        List<Document> languageBatches = findAllBatchesByLanguageInternal(language);
        if (!languageBatches.isEmpty()) {
            return transformToJsonsList(languageBatches);
        }
        else{
            return null;
        }

    }

    public List<String> findAllMixedLanguagesBatches() {
        List<Document> languageBatches = findAllBatchesByLanguageInternal(ALL_LANGUAGES_BATCH_LANGUAGE_ID);
        if(!languageBatches.isEmpty()){
            return transformToJsonsList(languageBatches);
        }
        else {
            return null;
        }

    }

    public String findLatestExecutedBatch(boolean languageSpecific, String language, BatchType batchType)
    {   Document doc;
        Bson language_criteria;
        if (languageSpecific) {
            language_criteria =  Filters.eq(LANGUAGE_FIELD_NAME, language);
        }
        else {
            language_criteria =  Filters.and(Filters.eq(LANGUAGE_FIELD_NAME, ALL_LANGUAGES_BATCH_LANGUAGE_ID),Filters.eq(BATCH_TYPE_FIELD_NAME, batchType.name()));
        }
        doc =  this.getBatchesCollection().find(language_criteria).sort(Sorts.descending(EXECUTION_START_TIMESTAMP)).first();
        if(Objects.nonNull(doc)) {
            return doc.toJson();
        }
        else {
            return null;
        }
    }

    private List<Document> findAllBatchesByLanguageInternal(String language) {
        List<Document> languageBatches = new ArrayList<>();
        getBatchesCollection().find(Filters.eq(LANGUAGE_FIELD_NAME, language)).into(languageBatches);
        return languageBatches;
    }

    private static List<String> transformToJsonsList(List<Document> docs) {
            return docs.stream().map(Document::toJson).collect(Collectors.toList());

    }

    @PostConstruct
    public void dbInit() {
        MongoCollection<Document> batchCollection = getBatchesCollection();
        batchCollection.createIndex(Indexes.descending(EXECUTION_START_TIMESTAMP));
        batchCollection.createIndex(Indexes.ascending(BATCH_ID_FIELD_NAME));
        batchCollection.createIndex(Indexes.ascending(LANGUAGE_FIELD_NAME));
        batchCollection.createIndex(Indexes.ascending(LANGUAGE_FIELD_NAME, BATCH_TYPE_FIELD_NAME));
    }

    private MongoCollection<Document> getBatchesCollection() {
        return mongoClient.getDatabase(dbName).getCollection(BATCHES_COLLECTION);
    }



}
