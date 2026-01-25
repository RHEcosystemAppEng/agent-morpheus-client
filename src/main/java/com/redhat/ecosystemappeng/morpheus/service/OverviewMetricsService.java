package com.redhat.ecosystemappeng.morpheus.service;

import com.redhat.ecosystemappeng.morpheus.model.OverviewMetricsDTO;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
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
        // Define the timeframe for 'Last Week'
        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        Date oneWeekAgoDate = Date.from(oneWeekAgo);
        // Convert to ISO string for string-based date comparisons (completed_at is stored as string)
        String oneWeekAgoIsoString = ISO_FORMATTER.format(oneWeekAgo);

        // Access the collection
        MongoCollection<Document> collection = getCollection();

        // Check if there's any data in the last week
        long docsWithSentAtLastWeek = collection.countDocuments(
            Filters.and(
                Filters.ne("metadata.sent_at", null),
                Filters.gte("metadata.sent_at", oneWeekAgoDate)
            )
        );
        
        // If no data in last week, return zeros (frontend will show empty state)
        if (docsWithSentAtLastWeek == 0) {
            return new OverviewMetricsDTO(0.0, 0.0, 0.0);
        }

        // Metric 1: successfullyAnalyzed
        // Calculation: Percentage of completed vs sent reports in the last week
        // Fields used:
        //   - metadata.sent_at: Timestamp when report was sent to the agent (denominator)
        //   - input.scan.completed_at: Timestamp when report analysis was completed (numerator)
        // Logic: Count reports with completed_at / Count reports with sent_at (both within last week)
        // Result: Percentage (0-100) of reports that were successfully analyzed
        double successfullyAnalyzed = calculateSuccessfullyAnalyzed(collection, oneWeekAgoDate, oneWeekAgoIsoString);

        // Metric 2: averageReliabilityScore
        // Calculation: Average intel_score from all vulnerability analyses in completed reports from the last week
        // Fields used:
        //   - input.scan.completed_at: Must be non-null and within last week
        //   - output.analysis[].intel_score: Intel score for each vulnerability analysis
        // Logic: Average all intel_score values from output.analysis array in completed reports
        //        Only includes reports with non-empty intel_score values
        // Result: Average intel score (0-100) representing reliability of vulnerability intelligence
        double averageReliabilityScore = calculateAverageReliabilityScore(collection, oneWeekAgoIsoString);

        // Metric 3: falsePositiveRate
        // Calculation: Percentage of vulnerability analyses determined as false positives from the last week
        // Fields used:
        //   - input.scan.completed_at: Must be non-null and within last week
        //   - output.analysis[].justification.status: Status of each vulnerability analysis
        // Logic: Count analysis items with status="FALSE" / Total analysis items in completed reports
        //        A status of "FALSE" means the agent determined the component is NOT vulnerable
        // Result: Percentage (0-100) of analyses that were false positives
        double falsePositiveRate = calculateFalsePositiveRate(collection, oneWeekAgoIsoString);

        return new OverviewMetricsDTO(
            successfullyAnalyzed, 
            averageReliabilityScore, 
            falsePositiveRate
        );
    }

    /**
     * Calculates the percentage of successfully analyzed reports.
     * Numerator: Reports with completed_at that were sent in the last week
     * Denominator: Reports with sent_at in the last week
     */
    private double calculateSuccessfullyAnalyzed(MongoCollection<Document> collection, Date oneWeekAgoDate, String oneWeekAgoIsoString) {
        // Count reports sent in the last week (denominator)
        // metadata.sent_at is stored as Date object
        Bson sentFilter = Filters.and(
            Filters.ne("metadata.sent_at", null),
            Filters.gte("metadata.sent_at", oneWeekAgoDate)
        );
        long totalSent = collection.countDocuments(sentFilter);

        if (totalSent == 0) {
            return 0.0;
        }

        // Count reports that were sent in the last week AND completed (numerator)
        // input.scan.completed_at is stored as ISO string, so we compare as string
        Bson completedFilter = Filters.and(
            Filters.ne("metadata.sent_at", null),
            Filters.gte("metadata.sent_at", oneWeekAgoDate),
            Filters.ne("input.scan.completed_at", null),
            Filters.gte("input.scan.completed_at", oneWeekAgoIsoString)
        );
        long totalCompleted = collection.countDocuments(completedFilter);

        return (totalCompleted * 100.0) / totalSent;
    }

    /**
     * Calculates the average intel_score from all vulnerability analyses in completed reports from the last week.
     * Only includes reports that have completed_at within the last week and non-empty intel_score values.
     */
    private double calculateAverageReliabilityScore(MongoCollection<Document> collection, String oneWeekAgoIsoString) {
        List<Bson> pipeline = new ArrayList<>();
        
        // Match only completed reports from the last week
        // input.scan.completed_at is stored as ISO string, so we compare as string
        pipeline.add(Aggregates.match(Filters.and(
            Filters.ne("input.scan.completed_at", null),
            Filters.gte("input.scan.completed_at", oneWeekAgoIsoString)
        )));
        
        // Unwind the analysis array to process each vulnerability analysis separately
        pipeline.add(Aggregates.unwind("$output.analysis"));
        
        // Match only analysis items with non-empty intel_score
        pipeline.add(Aggregates.match(Filters.and(
            Filters.exists("output.analysis.intel_score", true),
            Filters.ne("output.analysis.intel_score", null)
        )));
        
        // Group to calculate average
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
     * Calculates the percentage of false positives (status="FALSE") in completed reports from the last week.
     * Numerator: Count of analysis items with justification.status="FALSE"
     * Denominator: Total count of analysis items in completed reports from the last week
     */
    private double calculateFalsePositiveRate(MongoCollection<Document> collection, String oneWeekAgoIsoString) {
        List<Bson> pipeline = new ArrayList<>();
        
        // Match only completed reports from the last week
        // input.scan.completed_at is stored as ISO string, so we compare as string
        pipeline.add(Aggregates.match(Filters.and(
            Filters.ne("input.scan.completed_at", null),
            Filters.gte("input.scan.completed_at", oneWeekAgoIsoString)
        )));
        
        // Unwind the analysis array to process each vulnerability analysis separately
        pipeline.add(Aggregates.unwind("$output.analysis"));
        
        // Add a field to mark false positives (status = "FALSE")
        Document eqExpression = new Document("$eq", 
            List.of("$output.analysis.justification.status", "FALSE"));
        Document condExpression = new Document("$cond", 
            new Document("if", eqExpression)
            .append("then", 1)
            .append("else", 0)
        );
        pipeline.add(Aggregates.project(Projections.fields(
            Projections.include("output.analysis.justification.status"),
            Projections.computed("isFalsePositive", condExpression)
        )));
        
        // Count total analysis items and sum false positives
        pipeline.add(Aggregates.group(
            null,
            Accumulators.sum("total", 1),
            Accumulators.sum("falsePositives", "$isFalsePositive")
        ));

        Document result = collection.aggregate(pipeline).first();
        if (result == null || result.getInteger("total") == null || result.getInteger("total") == 0) {
            return 0.0;
        }

        int total = result.getInteger("total");
        int falsePositives = result.getInteger("falsePositives", 0);
        
        return (falsePositives * 100.0) / total;
    }
}