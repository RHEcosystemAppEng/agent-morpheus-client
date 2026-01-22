package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(name = "ReportsSummary", description = "Summary of reports statistics")
@RegisterForReflection
public record ReportsSummary(
    @Schema(required = true, description = "Count of reports containing vulnerable CVEs")
    long vulnerableReportsCount,
    @Schema(required = true, description = "Count of reports containing only non-vulnerable CVEs")
    long nonVulnerableReportsCount,
    @Schema(required = true, description = "Count of pending analysis requests")
    long pendingRequestsCount,
    @Schema(required = true, description = "Count of new reports submitted today")
    long newReportsTodayCount) {
}

