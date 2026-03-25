package com.redhat.ecosystemappeng.morpheus.service;

import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.Set;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.exception.ExhortCveGateException;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Parses Exhort (Trustify Dependency Analytics) analysis JSON for dependency CVE triage: validates every
 * {@code providers.*} entry ({@code status.ok}, empty {@code status.warnings} after omitting Syft main-module-only
 * warnings using the paired CycloneDX), then walks all providers' {@code sources} → {@code dependencies} →
 * {@code issues} and nested {@code transitive} trees.
 */
@ApplicationScoped
public class ExhortResponseParser {

    private static final Logger LOGGER = Logger.getLogger(ExhortResponseParser.class);
    private static final String PROVIDERS = "providers";
    private static final String SOURCES = "sources";
    private static final String DEPENDENCIES = "dependencies";
    private static final String ISSUES = "issues";
    private static final String CVES = "cves";
    private static final String TRANSITIVE = "transitive";
    private static final String STATUS = "status";
    private static final String OK = "ok";
    private static final String WARNINGS = "warnings";
    private static final String ID = "id";
    private static final int WARNINGS_LOG_MAX_CHARS = 2048;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    CycloneDxParsingService cycloneDxParsingService;

    /**
     * Returns true if the given CVE id appears in any dependency issue (under any provider) in the analysis
     * response. Walks {@code providers.*.sources} → {@code dependencies} (and {@code transitive}) → {@code issues}
     * → {@code cves} / {@code id}.
     * <p>
     * {@code cyclonedxJson} SHALL be the same CycloneDX body sent to Exhort for this analysis (non-blank JSON
     * object). It is used to drop {@code status.warnings} keys that refer only to the Syft main module per
     * {@link CycloneDxParsingService#collectSyftMainModuleBasePurls(JsonNode)}. Prefer
     * {@link #cveFoundInAnalysisResponse(String, String, JsonNode)} when a parsed root is already available.
     * <p>
     * Throws {@link ExhortCveGateException} when the response cannot be interpreted reliably (parse failure,
     * missing or empty {@code providers}, any provider missing {@code status.ok == true}, non-blank CycloneDX
     * required, CycloneDX not a JSON object, non-empty {@code status.warnings} after filtering, malformed shapes,
     * blank CVE id, or blank analysis response body).
     */
    public boolean cveFoundInAnalysisResponse(String analysisResponseJson, String cveId, String cyclonedxJson) {
        return cveFoundInAnalysisResponse(
                analysisResponseJson, cveId, requireCyclonedxDocumentForTriage(cyclonedxJson));
    }

    /**
     * Same as {@link #cveFoundInAnalysisResponse(String, String, String)} using an already-parsed CycloneDX root
     * (the same document sent to Exhort).
     */
    public boolean cveFoundInAnalysisResponse(String analysisResponseJson, String cveId, JsonNode cyclonedxRoot) {
        try {
            if (analysisResponseJson == null || analysisResponseJson.isBlank()) {
                throw new ExhortCveGateException("Exhort analysis response is empty or missing");
            }
            if (cveId == null || cveId.isBlank()) {
                throw new ExhortCveGateException("CVE id is required for dependency triage");
            }
            JsonNode cdxRoot = requireCyclonedxRootForTriage(cyclonedxRoot);
            Set<String> ignorableWarningBases = cycloneDxParsingService.collectSyftMainModuleBasePurls(cdxRoot);
            JsonNode root = objectMapper.readTree(analysisResponseJson);
            requireExhortAnalysisJsonObjectRoot(root);
            JsonNode providers = requireNonEmptyProvidersObject(root);
            assertAllProvidersAllowTriage(providers, ignorableWarningBases);
            String normalizedCve = cveId.trim();
            return cveInAllProviders(providers, normalizedCve);
        } catch (ExhortCveGateException e) {
            throw e;
        } catch (Exception e) {
            LOGGER.errorf("Failed to parse Exhort analysis response: %s", e.getMessage());
            throw new ExhortCveGateException("Failed to parse Exhort analysis response", e);
        }
    }

    private JsonNode requireCyclonedxRootForTriage(JsonNode cyclonedxRoot) {
        if (cyclonedxRoot == null || cyclonedxRoot.isNull() || cyclonedxRoot.isMissingNode()) {
            throw new ExhortCveGateException("CycloneDX JSON is required for dependency triage");
        }
        if (!cyclonedxRoot.isObject()) {
            throw new ExhortCveGateException("CycloneDX root must be a JSON object for dependency triage");
        }
        return cyclonedxRoot;
    }

    private JsonNode requireCyclonedxDocumentForTriage(String cyclonedxJson) {
        if (cyclonedxJson == null || cyclonedxJson.isBlank()) {
            throw new ExhortCveGateException("CycloneDX JSON is required for dependency triage");
        }
        try {
            JsonNode root = objectMapper.readTree(cyclonedxJson);
            return requireCyclonedxRootForTriage(root);
        } catch (ExhortCveGateException e) {
            throw e;
        } catch (Exception e) {
            throw new ExhortCveGateException("Failed to parse CycloneDX JSON for dependency triage", e);
        }
    }

    private static void requireExhortAnalysisJsonObjectRoot(JsonNode root) {
        if (root == null || !root.isObject()) {
            throw new ExhortCveGateException(
                    "Exhort analysis response root is not a JSON object; cannot verify dependency CVE data");
        }
    }

    private JsonNode requireNonEmptyProvidersObject(JsonNode root) {
        JsonNode providers = root.get(PROVIDERS);
        if (providers == null || !providers.isObject()) {
            throw new ExhortCveGateException(
                    "Exhort analysis response has no \"providers\" object; cannot verify dependency CVE data");
        }
        if (providers.isEmpty()) {
            throw new ExhortCveGateException(
                    "Exhort analysis response has an empty \"providers\" object; cannot verify dependency CVE data");
        }
        return providers;
    }

    private void assertAllProvidersAllowTriage(JsonNode providers, Set<String> ignorableWarningBases) {
        Iterator<String> names = providers.fieldNames();
        while (names.hasNext()) {
            String providerId = names.next();
            JsonNode report = providers.get(providerId);
            if (report == null || !report.isObject()) {
                throw new ExhortCveGateException(
                        "Exhort analysis response has invalid provider entry for \"" + providerId
                                + "\"; cannot verify dependency CVE data");
            }
            JsonNode status = report.get(STATUS);
            if (status == null || !status.isObject()) {
                throw new ExhortCveGateException(
                        "Exhort analysis response has no \"status\" object for provider \"" + providerId
                                + "\"; cannot verify dependency CVE data");
            }
            JsonNode ok = status.get(OK);
            if (ok == null || !ok.isBoolean() || !ok.booleanValue()) {
                throw new ExhortCveGateException(
                        "Exhort analysis response has status.ok not true for provider \"" + providerId
                                + "\"; cannot verify dependency CVE data");
            }
            assertStatusWarningsAllowTriage(status.get(WARNINGS), providerId, ignorableWarningBases);
        }
    }

    /**
     * Non-empty {@code status.warnings} (after omitting ignorable Syft main-module keys) or unexpected warning
     * shapes fail triage.
     */
    private void assertStatusWarningsAllowTriage(
            JsonNode warnings, String providerId, Set<String> ignorableWarningBases) {
        if (warnings == null || warnings.isNull() || warnings.isMissingNode()) {
            return;
        }
        if (warnings.isArray()) {
            if (warnings.size() > 0) {
                logAndThrowNonEmptyWarnings(warnings, providerId);
            }
            return;
        }
        if (warnings.isObject()) {
            JsonNode effective = filterWarningsIgnoringSyftMainModule(warnings, ignorableWarningBases);
            if (effective.size() > 0) {
                logAndThrowNonEmptyWarnings(effective, providerId);
            }
            return;
        }
        throw new ExhortCveGateException(
                "Exhort analysis response has unexpected type for providers." + providerId + ".status.warnings; "
                        + "cannot verify dependency CVE data");
    }

    private JsonNode filterWarningsIgnoringSyftMainModule(JsonNode warnings, Set<String> ignorableWarningBases) {
        if (ignorableWarningBases == null || ignorableWarningBases.isEmpty()) {
            return warnings;
        }
        ObjectNode out = objectMapper.createObjectNode();
        Iterator<String> keys = warnings.fieldNames();
        while (keys.hasNext()) {
            String key = keys.next();
            String base = CycloneDxParsingService.basePurlForExhortWarningMatch(key);
            if (!ignorableWarningBases.contains(base)) {
                out.set(key, warnings.get(key));
            }
        }
        return out;
    }

    private void logAndThrowNonEmptyWarnings(JsonNode warnings, String providerId) {
        String bounded = boundedJsonForLog(warnings);
        LOGGER.warnf(
                "Exhort analysis returned non-empty status.warnings for provider \"%s\" (incomplete dependency scan); "
                        + "treating as dependency triage failure. warnings=%s",
                providerId,
                bounded);
        throw new ExhortCveGateException(
                "Exhort analysis returned non-empty status.warnings for provider \"" + providerId
                        + "\" (incomplete dependency scan)");
    }

    private String boundedJsonForLog(JsonNode node) {
        try {
            String raw = objectMapper.writeValueAsString(node);
            if (raw.length() <= WARNINGS_LOG_MAX_CHARS) {
                return raw;
            }
            return raw.substring(0, WARNINGS_LOG_MAX_CHARS) + "...(truncated)";
        } catch (Exception e) {
            throw new ExhortCveGateException("Failed to serialize Exhort status.warnings for logging", e);
        }
    }

    private boolean cveInAllProviders(JsonNode providers, String cveId) {
        Iterator<String> names = providers.fieldNames();
        while (names.hasNext()) {
            JsonNode report = providers.get(names.next());
            if (report == null || !report.isObject()) {
                continue;
            }
            JsonNode sources = report.get(SOURCES);
            if (sources == null || sources.isNull() || sources.isMissingNode()) {
                continue;
            }
            if (!sources.isObject()) {
                throw new ExhortCveGateException(
                        "Exhort analysis response has non-object \"sources\" for a provider; cannot verify CVE presence");
            }
            Iterator<String> sourceKeys = sources.fieldNames();
            while (sourceKeys.hasNext()) {
                JsonNode source = sources.get(sourceKeys.next());
                if (source == null || !source.isObject()) {
                    continue;
                }
                JsonNode dependencies = source.get(DEPENDENCIES);
                if (dependencies == null || dependencies.isNull() || dependencies.isMissingNode()) {
                    continue;
                }
                if (!dependencies.isArray()) {
                    throw new ExhortCveGateException(
                            "Exhort analysis response has non-array \"dependencies\" under a source; "
                                    + "cannot verify CVE presence");
                }
                if (cveInDependencies(dependencies, cveId)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean cveInDependencies(JsonNode dependencies, String cveId) {
        if (dependencies == null || !dependencies.isArray()) {
            return false;
        }
        for (JsonNode dep : dependencies) {
            if (dep == null || !dep.isObject()) {
                continue;
            }
            if (cveInIssues(dep.get(ISSUES), cveId)) {
                return true;
            }
            JsonNode transitive = dep.get(TRANSITIVE);
            if (transitive == null || transitive.isNull() || transitive.isMissingNode()) {
                continue;
            }
            if (!transitive.isArray()) {
                throw new ExhortCveGateException(
                        "Exhort analysis response has non-array \"transitive\" on a dependency; "
                                + "cannot verify CVE presence");
            }
            if (cveInDependencies(transitive, cveId)) {
                return true;
            }
        }
        return false;
    }

    private boolean cveInIssues(JsonNode issues, String cveId) {
        if (issues == null || issues.isNull() || issues.isMissingNode()) {
            return false;
        }
        if (!issues.isArray()) {
            throw new ExhortCveGateException(
                    "Exhort analysis response has non-array \"issues\" on a dependency; cannot verify CVE presence");
        }
        for (JsonNode issue : issues) {
            if (issue == null || !issue.isObject()) {
                continue;
            }
            JsonNode idNode = issue.get(ID);
            if (idNode != null && idNode.isTextual() && cveId.equals(idNode.asText().trim())) {
                return true;
            }
            JsonNode cves = issue.get(CVES);
            if (cves != null && cves.isArray()) {
                for (JsonNode cve : cves) {
                    if (cve != null && cveId.equals(cve.asText("").trim())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Collects all CVE ids from dependency issues under every provider in the Exhort analysis response.
     * Walks {@code providers.*.sources} → {@code dependencies} (and {@code transitive}) → {@code issues} →
     * {@code cves} and issue {@code id} strings.
     * <p>
     * {@code cyclonedxJson} SHALL be the same CycloneDX body sent to Exhort for this analysis (non-blank JSON
     * object). Same aggregate rules as {@link #cveFoundInAnalysisResponse(String, String, String)}.
     */
    public Set<String> collectCveIdsFromAnalysisResponse(String analysisResponseJson, String cyclonedxJson) {
        return collectCveIdsFromAnalysisResponse(
                analysisResponseJson, requireCyclonedxDocumentForTriage(cyclonedxJson));
    }

    /**
     * Same as {@link #collectCveIdsFromAnalysisResponse(String, String)} with a parsed CycloneDX root.
     */
    public Set<String> collectCveIdsFromAnalysisResponse(String analysisResponseJson, JsonNode cyclonedxRoot) {
        try {
            if (analysisResponseJson == null || analysisResponseJson.isBlank()) {
                throw new ExhortCveGateException("Exhort analysis response is empty or missing");
            }
            JsonNode cdxRoot = requireCyclonedxRootForTriage(cyclonedxRoot);
            Set<String> ignorableWarningBases = cycloneDxParsingService.collectSyftMainModuleBasePurls(cdxRoot);
            JsonNode root = objectMapper.readTree(analysisResponseJson);
            requireExhortAnalysisJsonObjectRoot(root);
            JsonNode providers = requireNonEmptyProvidersObject(root);
            assertAllProvidersAllowTriage(providers, ignorableWarningBases);
            Set<String> cveIds = new LinkedHashSet<>();
            collectFromAllProviders(providers, cveIds);
            return cveIds;
        } catch (ExhortCveGateException e) {
            throw e;
        } catch (Exception e) {
            LOGGER.errorf("Failed to parse Exhort analysis response for CVE collection: %s", e.getMessage());
            throw new ExhortCveGateException("Failed to parse Exhort analysis response for CVE collection", e);
        }
    }

    private void collectFromAllProviders(JsonNode providers, Set<String> cveIds) {
        Iterator<String> names = providers.fieldNames();
        while (names.hasNext()) {
            JsonNode report = providers.get(names.next());
            if (report == null || !report.isObject()) {
                continue;
            }
            JsonNode sources = report.get(SOURCES);
            if (sources == null || sources.isNull() || sources.isMissingNode()) {
                continue;
            }
            if (!sources.isObject()) {
                throw new ExhortCveGateException(
                        "Exhort analysis response has non-object \"sources\" for a provider; cannot collect CVE ids");
            }
            Iterator<String> sourceKeys = sources.fieldNames();
            while (sourceKeys.hasNext()) {
                JsonNode source = sources.get(sourceKeys.next());
                if (source == null || !source.isObject()) {
                    continue;
                }
                JsonNode dependencies = source.get(DEPENDENCIES);
                if (dependencies == null || dependencies.isNull() || dependencies.isMissingNode()) {
                    continue;
                }
                if (!dependencies.isArray()) {
                    throw new ExhortCveGateException(
                            "Exhort analysis response has non-array \"dependencies\" under a source; "
                                    + "cannot collect CVE ids");
                }
                collectCvesFromDependencies(dependencies, cveIds);
            }
        }
    }

    private void collectCvesFromDependencies(JsonNode dependencies, Set<String> cveIds) {
        if (dependencies == null || !dependencies.isArray()) {
            return;
        }
        for (JsonNode dep : dependencies) {
            if (dep == null || !dep.isObject()) {
                continue;
            }
            collectCvesFromIssues(dep.get(ISSUES), cveIds);
            JsonNode transitive = dep.get(TRANSITIVE);
            if (transitive == null || transitive.isNull() || transitive.isMissingNode()) {
                continue;
            }
            if (!transitive.isArray()) {
                throw new ExhortCveGateException(
                        "Exhort analysis response has non-array \"transitive\" on a dependency; "
                                + "cannot collect CVE ids");
            }
            collectCvesFromDependencies(transitive, cveIds);
        }
    }

    private void collectCvesFromIssues(JsonNode issues, Set<String> cveIds) {
        if (issues == null || issues.isNull() || issues.isMissingNode()) {
            return;
        }
        if (!issues.isArray()) {
            throw new ExhortCveGateException(
                    "Exhort analysis response has non-array \"issues\" on a dependency; cannot collect CVE ids");
        }
        for (JsonNode issue : issues) {
            if (issue == null || !issue.isObject()) {
                continue;
            }
            JsonNode idNode = issue.get(ID);
            if (idNode != null && idNode.isTextual()) {
                String id = idNode.asText("").trim();
                if (!id.isEmpty()) {
                    cveIds.add(id);
                }
            }
            JsonNode cves = issue.get(CVES);
            if (cves == null || !cves.isArray()) {
                continue;
            }
            for (JsonNode cve : cves) {
                if (cve != null) {
                    String id = cve.asText("").trim();
                    if (!id.isEmpty()) {
                        cveIds.add(id);
                    }
                }
            }
        }
    }
}
