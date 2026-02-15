package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;

@Schema(name = "ProductReportsSummary", description = "Product reports data")
@RegisterForReflection
public record ProductReportsSummary(
    @Schema(required = true, description = "Product state of analysis")
    String productState,
    @Schema(required = true, description = "Map of analysis state to count of reports with that state", type = SchemaType.OBJECT)
    Map<String, Integer> statusCounts,
    @Schema(required = true, description = "Map of justification status to count of reports with that status", type = SchemaType.OBJECT)
    Map<String, Integer> justificationStatusCounts
) {}


