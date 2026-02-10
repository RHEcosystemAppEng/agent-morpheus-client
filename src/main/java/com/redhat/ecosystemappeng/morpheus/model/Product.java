package com.redhat.ecosystemappeng.morpheus.model;

import java.util.List;
import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(name = "Product", description = "Product metadata")
@RegisterForReflection
public record Product(
    @Schema(required = true, description = "Product ID")
    String id,
    @Schema(required = true, description = "Product name")
    String name,
    @Schema(required = true, description = "Product version")
    String version,
    @Schema(description = "Submitted at timestamp")
    String submittedAt,
    @Schema(description = "Submitted count")
    Integer submittedCount,
    @Schema(description = "CVE ID associated with this product")
    String cveId,
    @Schema(description = "User provided metadata for the product")
    Map<String, String> metadata,
    @Schema(description = "Submission failures")
    List<FailedComponent> submissionFailures,
    @Schema(description = "Completed at timestamp")
    String completedAt
) {}


