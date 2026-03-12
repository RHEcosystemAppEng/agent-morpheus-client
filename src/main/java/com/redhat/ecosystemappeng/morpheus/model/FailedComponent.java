package com.redhat.ecosystemappeng.morpheus.model;

import org.eclipse.microprofile.openapi.annotations.media.Schema;
import io.quarkus.runtime.annotations.RegisterForReflection;

@Schema(name = "FailedComponent", description = "Metadata of submitted components failed to be processed for scanning")
@RegisterForReflection
public record FailedComponent(
    @Schema(required = true, description = "Component name")
    String name,
    @Schema(required = true, description = "Component version")
    String version,
    @Schema(required = true, description = "Component image")
    String image,
    @Schema(required = true, description = "Error message")
    String error) {
}
