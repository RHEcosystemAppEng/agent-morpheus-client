package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Map;
import java.util.Set;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;

@Schema(name = "Report", description = "Report metadata")
@RegisterForReflection
public record Report(
    @Schema(required = true, description = "Report ID")
    String id,
    @Schema(required = true, description = "Report name")
    String name,
    @Schema(required = true, description = "Started at timestamp for report analysis")
    String startedAt,
    @Schema(required = true, description = "Completed at timestamp for report analysis")
    String completedAt,
    @Schema(required = true, description = "Image name")
    String imageName,
    @Schema(required = true, description = "Image tag")
    String imageTag,
    @Schema(required = true, description = "State of the report analysis")
    String state,
    @Schema(required = true, description = "Vulnerabilities in the report and their analysis results", type = SchemaType.ARRAY, implementation = VulnResult.class)
    Set<VulnResult> vulns,
    @Schema(required = true, description = "User provided metadata for the report")
    Map<String, String> metadata,
    @Schema(description = "Git repository URL from source_info")
    String gitRepo,
    @Schema(description = "Git reference (commit hash, tag, or branch) from source_info")
    String ref) {

}
