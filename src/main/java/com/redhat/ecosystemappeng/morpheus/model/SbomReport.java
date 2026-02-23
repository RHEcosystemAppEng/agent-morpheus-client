package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(name = "SbomReport", description = "SBOM report data grouped by sbom_report_id")
@RegisterForReflection
public record SbomReport(
    @Schema(description = "SBOM name from first report's metadata.sbom_name")
    String sbomName,
    @Schema(required = true, description = "SBOM report ID from first report's metadata.sbom_report_id")
    String sbomReportId,
    @Schema(description = "CVE ID from first report's input.scan.vulns[0].vuln_id")
    String cveId,
    @Schema(required = true, description = "Map of CVE status to count of reports with that status")
    Map<String, Integer> cveStatusCounts,
    @Schema(required = true, description = "Map of report status to count of reports with that status")
    Map<String, Integer> statusCounts,
    @Schema(description = "Completed at timestamp - empty if any report's completed_at is empty, otherwise latest value")
    String completedAt,
    @Schema(description = "Submitted at timestamp from first report's metadata.submitted_at")
    String submittedAt,
    @Schema(required = true, description = "Number of reports in this SBOM report group")
    Integer numReports,
    @Schema(description = "MongoDB document _id (as hex string) of the first report in the group, always populated for navigation purposes")
    String firstReportId) {
}

