package com.redhat.ecosystemappeng.morpheus.model;

import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;
import java.util.Map;

@Schema(name = "Product", description = "Product metadata")
@RegisterForReflection
public record Product(
    @Schema(required = true, description = "Product ID")
    String id,
    @Schema(required = true, description = "Product name")
    String name,
    @Schema(required = true, description = "Product version")
    String version,
    @Schema(required = true, description = "Timestamp of product scan request submission")
    String submittedAt,
    @Schema(required = true, description = "Number of components submitted for scanning")
    int submittedCount,
    @Schema(required = true, description = "Product user provided metadata")
    Map<String, String> metadata,
    @Schema(type = SchemaType.ARRAY, implementation = FailedComponent.class, required = true, description = "List of submitted components failed to be processed for scanning")
    List<FailedComponent> submissionFailures,
    @Schema(description = "Timestamp of product scan request completion")
    String completedAt,
    @Schema(required = true, description = "CVE ID associated with this product")
    String cveId
) {
    public Product(String id, String name, String version, String submittedAt, int submittedCount, Map<String, String> metadata, List<FailedComponent> submissionFailures, String cveId) {
        this(id, name, version, submittedAt, submittedCount, metadata, submissionFailures, null, cveId);
    }
} 