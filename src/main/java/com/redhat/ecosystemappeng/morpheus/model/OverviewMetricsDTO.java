package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@RegisterForReflection
@Schema(name = "OverviewMetrics", description = "Metrics for the home page calculated from data in the last week")
public record OverviewMetricsDTO(
    @Schema(description = "The percentage of repositories successfully analyzed in the last week")
    double successfullyAnalyzed,

    @Schema(description = "The average reliability score of the intelligence data from completed reports in the last week")
    double averageReliabilityScore,

    @Schema(description = "The percentage of false positives identified from completed reports in the last week")
    double falsePositiveRate
) {}