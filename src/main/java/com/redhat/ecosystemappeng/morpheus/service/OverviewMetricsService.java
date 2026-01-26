package com.redhat.ecosystemappeng.morpheus.service;

import com.redhat.ecosystemappeng.morpheus.model.OverviewMetricsDTO;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Accumulators;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Service for calculating overview metrics for the home page.
 * All metrics are calculated from data in the last 7 days (last week).
 */
@ApplicationScoped
public class OverviewMetricsService {

    private static final String COLLECTION = "reports";
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
            .withZone(ZoneOffset.UTC);

    @Inject
    MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    private MongoCollection<Document> getCollection() {
        return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
    }

    public OverviewMetricsDTO getMetrics() {
        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        Date oneWeekAgoDate = Date.from(oneWeekAgo);
        String oneWeekAgoIsoString = ISO_FORMATTER.format(oneWeekAgo);

        MongoCollection<Document> collection = getCollection();

        long docsWithSentAtLastWeek = collection.countDocuments(
            Filters.and(
                Filters.ne("metadata.sent_at", null),
                Filters.gte("metadata.sent_at", oneWeekAgoDate)
            )
        );
        
        if (docsWithSentAtLastWeek == 0) {
            return new OverviewMetricsDTO(0.0, 0.0, 0.0);
        }

        double successfullyAnalyzed = calculateSuccessfullyAnalyzed(collection, oneWeekAgoDate, oneWeekAgoIsoString);
        double averageReliabilityScore = calculateAverageReliabilityScore(collection, oneWeekAgoIsoString);
        double falsePositiveRate = calculateFalsePositiveRate(collection, oneWeekAgoIsoString);

        return new OverviewMetricsDTO(
            successfullyAnalyzed, 
            averageReliabilityScore, 
            falsePositiveRate
        );
    }

    /**
     * Calculates the percentage of successfully analyzed reports.
     * Formula: (Reports with completed_at not null / Total reports) * 100
     */
    private double calculateSuccessfullyAnalyzed(MongoCollection<Document> collection, Date oneWeekAgoDate, String oneWeekAgoIsoString) {
        long totalReports = collection.countDocuments(new Document());
        if (totalReports == 0) {
            return 0.0;
        }
        long totalCompleted = collection.countDocuments(Filters.ne("input.scan.completed_at", null));
        return (totalCompleted * 100.0) / totalReports;
    }

    /**
     * Calculates the average intel_score from all vulnerability analyses in completed reports from the last week.
     * Only includes analysis items with non-null intel_score values.
     */
    private double calculateAverageReliabilityScore(MongoCollection<Document> collection, String oneWeekAgoIsoString) {
        List<Bson> pipeline = new ArrayList<>();
        pipeline.add(Aggregates.match(Filters.and(
            Filters.ne("input.scan.completed_at", null),
            Filters.gte("input.scan.completed_at", oneWeekAgoIsoString)
        )));
        pipeline.add(Aggregates.unwind("$output.analysis"));
        pipeline.add(Aggregates.match(Filters.and(
            Filters.exists("output.analysis.intel_score", true),
            Filters.ne("output.analysis.intel_score", null)
        )));
        pipeline.add(Aggregates.group(
            null,
            Accumulators.avg("avgScore", "$output.analysis.intel_score")
        ));

        Document result = collection.aggregate(pipeline).first();
        if (result == null || result.get("avgScore") == null) {
            return 0.0;
        }
        return result.getDouble("avgScore");
    }

    /**
     * Calculates the percentage of false positives in completed reports from the last week.
     * Formula: (Analysis items with status="FALSE" / Total analysis items) * 100
     */
    private double calculateFalsePositiveRate(MongoCollection<Document> collection, String oneWeekAgoIsoString) {
        List<Bson> pipeline = new ArrayList<>();
        pipeline.add(Aggregates.match(Filters.and(
            Filters.ne("input.scan.completed_at", null),
            Filters.gte("input.scan.completed_at", oneWeekAgoIsoString)
        )));
        pipeline.add(Aggregates.unwind("$output.analysis"));
        pipeline.add(Aggregates.group(
            null,
            Accumulators.sum("total", 1),
            Accumulators.sum("falsePositives", new Document("$cond", 
                new Document("if", new Document("$eq", 
                    List.of("$output.analysis.justification.status", "FALSE")))
                .append("then", 1)
                .append("else", 0)))
        ));

        Document result = collection.aggregate(pipeline).first();
        if (result == null || result.getInteger("total") == null || result.getInteger("total") == 0) {
            return 0.0;
        }
        return (result.getInteger("falsePositives", 0) * 100.0) / result.getInteger("total");
    }
}