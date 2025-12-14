package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Set;
import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(name = "ProductReportsSummary", description = "Product reports data")
@RegisterForReflection
public record ProductReportsSummary(
    @Schema(required = true, description = "Product state of analysis")
    String productState,
    @Schema(required = true, description = "Map of component analysis states to their counts")
    Map<String, Integer> componentStates,
    @Schema(required = true, description = "Map of CVE vulnerabilities and their justifications")
    Map<String, Set<Justification>> cves,
    @Schema(required = true, description = "Map of each CVE to its status counts (status -> count)")
    Map<String, Map<String, Integer>> cveStatusCounts) {
}