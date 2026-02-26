package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Collection;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.SbomInfoType;

import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.Valid;

import com.redhat.ecosystemappeng.morpheus.model.morpheus.Image;

@Schema(name = "ReportRequest", description = "A single report request")
@RegisterForReflection
public record ReportRequest(
    @Schema(description = "ID assigned on scan request submission (auto-generated if not provided)")
    String id, 
    @Schema(required = true, description = "Analysis form type (image|source)")
    String analysisType,
    @Schema(required = true, description = "List of vulnerability IDs to analyze")
    Collection<String> vulnerabilities, 
    @Schema(description = "Image data (required if SBOM is not provided)", type = SchemaType.OBJECT, implementation = Image.class)
    JsonNode image,
    @Schema(description = "Credential for private repository access (optional, required only for private repository access)")
    @Valid
    InlineCredential credential,
    @Schema(
        description = "SBOM data (required if image is not provided)",
        type = SchemaType.OBJECT,
        implementation = Object.class,
        example = """
            {
                "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
                "bomFormat": "CycloneDX",
                "specVersion": "1.6",
                "serialNumber": "generated UUID",
                "version": 1,
                "metadata": {
                    "timestamp": "current timestamp",
                    "tools": [],
                    "component": {},
                    "properties": []
                },
                "components": [],
                "dependencies": []
            }
        """
    )
    JsonNode sbom,
    @Schema(description = "SBOM information type", enumeration = {"manual", "cyclonedx+json"})
    @JsonProperty("sbom_info_type") SbomInfoType sbomInfoType, 
    @Schema(required = true, description = "Request metadata")
    Map<String, String> metadata,
    @Schema(description = "Source code repository (required if SBOM is not provided)")
    String sourceRepo,
    @Schema(description = "Commit ID (required if SBOM is not provided)")
    String commitId,
    @Schema(description = "Programming language ecosystem")
    String ecosystem,
    @Schema(description = "Manifest file path")
    String manifestPath) {

    /**
     * Creates a copy of this request without the credential field.
     * Used to prevent credentials from being persisted in MongoDB.
     *
     * @return new ReportRequest with credential set to null, or this instance if credential is already null
     */
    public ReportRequest withoutCredential() {
        if (credential == null) {
            return this;
        }
        return new ReportRequest(
            id,
            analysisType,
            vulnerabilities,
            image,
            null,
            sbom,
            sbomInfoType,
            metadata,
            sourceRepo,
            commitId,
            ecosystem,
            manifestPath
        );
    }
}
