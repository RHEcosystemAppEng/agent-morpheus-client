/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Metrics for the home page calculated from data in the last week
 */
export type OverviewMetrics = {
    /**
     * The count of reports that were completed in the last week (reports with completed_at not null and date within last 7 days)
     */
    successfullyAnalyzed?: number;
    /**
     * The average reliability score (intel_score) calculated as sum of all intel_score values divided by the count of completed reports from the last week
     */
    averageReliabilityScore?: number;
    /**
     * The percentage of false positives identified from completed reports in the last week, calculated as (reports with output.analysis.0.justification.status='FALSE' / total completed reports) * 100
     */
    falsePositiveRate?: number;
};

