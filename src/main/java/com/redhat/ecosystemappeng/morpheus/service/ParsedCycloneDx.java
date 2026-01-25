package com.redhat.ecosystemappeng.morpheus.service;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Result of parsing a CycloneDX file, containing both the parsed JSON and the extracted SBOM name and version.
 */
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
    String sbomVersion
) {
}

