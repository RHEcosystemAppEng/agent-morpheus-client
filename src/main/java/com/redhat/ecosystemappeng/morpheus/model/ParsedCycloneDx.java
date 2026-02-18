package com.redhat.ecosystemappeng.morpheus.model;

import com.fasterxml.jackson.databind.JsonNode;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Result of parsing a CycloneDX file, containing both the parsed JSON and the extracted SBOM metadata.
 */
@RegisterForReflection
public record ParsedCycloneDx(
    /**
     * The parsed CycloneDX JSON structure
     */
    JsonNode sbomJson,
    /**
     * The SBOM name extracted from metadata.component.name
     */
    String sbomName,
    /**
     * The SBOM version extracted from metadata.component.version (may be null if not present)
     */
    String sbomVersion,
    /**
     * The SBOM description extracted from metadata.component.description (may be null if not present)
     */
    String sbomDescription,
    /**
     * The SBOM type extracted from metadata.component.type (may be null if not present)
     */
    String sbomType,
    /**
     * The SBOM purl extracted from metadata.component.purl (may be null if not present)
     */
    String sbomPurl,
    /**
     * The BOM reference extracted from metadata.component.bom-ref (may be null if not present)
     */
    String bomRef
) {
}

