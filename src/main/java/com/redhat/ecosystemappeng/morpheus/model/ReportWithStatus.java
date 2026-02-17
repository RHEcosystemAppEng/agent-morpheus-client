package com.redhat.ecosystemappeng.morpheus.model;

import com.fasterxml.jackson.databind.JsonNode;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import io.quarkus.runtime.annotations.RegisterForReflection;

@Schema(name = "ReportWithStatus", description = "Report data with calculated analysis status")
@RegisterForReflection
public record ReportWithStatus(
    @Schema(type = SchemaType.OBJECT, implementation = Object.class, required = true, description = "Full report data from MongoDB")
    JsonNode report,
    @Schema(required = true, description = "Calculated analysis status of the report (completed, queued, sent, expired, failed, pending, unknown)")
    String status) {

}

