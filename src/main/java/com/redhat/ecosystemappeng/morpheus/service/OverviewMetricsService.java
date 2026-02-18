package com.redhat.ecosystemappeng.morpheus.service;

import com.redhat.ecosystemappeng.morpheus.model.OverviewMetricsDTO;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

/**
 * Service for calculating overview metrics for the home page.
 * All metrics are calculated from data in the last 7 days (last week).
 * 
 * Calculation approach:
 * 1. First calculates the count of completed reports from the last week (reused for all metrics)
 * 2. Returns the count of completed reports as the first metric
 * 3. Calculates average reliability score using manual sum/division (not aggregation), using only the first analysis item (index 0)
 * 4. Calculates false positive rate as percentage using only the first analysis item (index 0)
 */
@ApplicationScoped
public class OverviewMetricsService {
    private static final String COLLECTION = "reports";
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
            .withZone(ZoneOffset.UTC);

    private MongoClient mongoClient;

    @Inject    
    public void setMongoClient(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    private MongoCollection<Document> getCollection() {
        return mongoClient.getDatabase(dbName).getCollection(COLLECTION);
    }

    private Bson getCompletedReportsFromLastWeekFilter(String oneWeekAgoIsoString) {
        return Filters.and(
            Filters.ne("input.scan.completed_at", null),
            Filters.gte("input.scan.completed_at", oneWeekAgoIsoString)
        );
    }

    /**
     * @return OverviewMetricsDTO containing the three metrics
     */
    public OverviewMetricsDTO getMetrics() {
        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        String oneWeekAgoIsoString = ISO_FORMATTER.format(oneWeekAgo);
        MongoCollection<Document> collection = getCollection();
        // Calculate completed reports count from last week (used by all metrics)
        Bson completedReportsFilter = getCompletedReportsFromLastWeekFilter(oneWeekAgoIsoString);
        long completedReportsCount = collection.countDocuments(completedReportsFilter);

        // If no completed reports, return zeros
        if (completedReportsCount == 0) {
            return new OverviewMetricsDTO(0.0, 0.0, 0.0);
        }

        // First metric - count of completed reports (same as completedReportsCount)
        double successfullyAnalyzed = (double) completedReportsCount;
        // Second metric - average reliability score using manual sum/division
        double averageReliabilityScore = calculateAverageReliabilityScore(collection, completedReportsFilter, completedReportsCount);
        // Third metric - false positive rate as percentage
        double falsePositiveRate = calculateFalsePositiveRate(collection, completedReportsFilter, completedReportsCount);

        return new OverviewMetricsDTO(
            successfullyAnalyzed, 
            averageReliabilityScore, 
            falsePositiveRate
        );
    }


    private double calculateAverageReliabilityScore(MongoCollection<Document> collection, Bson completedReportsFilter, long completedReportsCount) {
        if (completedReportsCount == 0) {
            return 0.0;
        }

        double sum = 0.0;
        int count = 0;
        
        for (Document report : collection.find(completedReportsFilter)) {
            Document output = report.get("output", Document.class);
            if (Objects.nonNull(output)) {
                List<?> analysisList = output.getList("analysis", Document.class);
                if (Objects.nonNull(analysisList) && analysisList.size() > 0) {
                    // Only use the first analysis item (index 0)
                    Object firstItem = analysisList.get(0);
                    if (firstItem instanceof Document) {
                        Document analysisItem = (Document) firstItem;
                        Object intelScoreObj = analysisItem.get("intel_score");
                        if (Objects.nonNull(intelScoreObj)) {
                                double intelScore = getDoubleValue(intelScoreObj);
                                sum += intelScore;
                                count++;
                        }
                    }
                }
            }
        }

        if (count == 0) {
            return 0.0;
        }

        // Calculate average: sum / count of completed reports
        return sum / completedReportsCount;
    }

    /**
     * Helper method to extract double value from various numeric types.
     */
    private double getDoubleValue(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        throw new IllegalArgumentException("Cannot convert to double: " + value);
    }

    
    private double calculateFalsePositiveRate(MongoCollection<Document> collection, Bson completedReportsFilter, long completedReportsCount) {
        if (completedReportsCount == 0) {
            return 0.0;
        }

        // Count reports where the first analysis item (index 0) has status = "FALSE"
        Bson falsePositiveFilter = Filters.and(
            completedReportsFilter,
            Filters.eq("output.analysis.0.justification.status", "FALSE")
        );
        long falsePositives = collection.countDocuments(falsePositiveFilter);

        return (falsePositives * 100.0) / completedReportsCount;
    }
}