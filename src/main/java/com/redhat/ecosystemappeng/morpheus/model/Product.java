package com.redhat.ecosystemappeng.morpheus.model;

import java.util.List;
import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;

@Schema(name = "Product", description = "Product metadata")
@RegisterForReflection
public record Product(
    @Schema(required = true, description = "Product ID")
    String id,
    @Schema(required = true, description = "Product name")
    String name,
    @Schema(required = true, description = "Product version")
    String version,
    @Schema(description = "Timestamp of product scan request submission")
    String submittedAt,
    @Schema(description = "Number of components submitted for scanning")
    Integer submittedCount,
    @Schema(description = "CVE ID associated with this product")
    String cveId,
    @Schema(description = "Product user provided metadata")
    Map<String, String> metadata,
    @Schema(type = SchemaType.ARRAY, implementation = FailedComponent.class, description = "List of submitted components failed to be processed for scanning")
    List<FailedComponent> submissionFailures,
    @Schema(description = "Timestamp of product scan request completion")
    String completedAt
) {}


