package com.redhat.ecosystemappeng.morpheus.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.exception.ExhortCveGateException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ExhortResponseParserTest {

    private ExhortResponseParser parser;

    /** Minimal CycloneDX object with empty {@code components} (no Syft main-module rows). */
    static String minimalCyclonedx() {
        return """
                {"bomFormat":"CycloneDX","specVersion":"1.6","metadata":{"component":{"name":"t"}},"components":[]}
                """;
    }

    static String cyclonedxWithSyftMainModule(String moduleName, String purl) {
        return """
                {"bomFormat":"CycloneDX","specVersion":"1.6","metadata":{"component":{"name":"t"}},"components":[{
                  "type":"library","name":"%s","purl":"%s",
                  "properties":[{"name":"syft:metadata:mainModule","value":"%s"}]
                }]}
                """
                .formatted(moduleName, purl, moduleName);
    }

    @BeforeEach
    void setUp() throws Exception {
        parser = new ExhortResponseParser();
        ObjectMapper om = new ObjectMapper();
        var omField = ExhortResponseParser.class.getDeclaredField("objectMapper");
        omField.setAccessible(true);
        omField.set(parser, om);
        CycloneDxParsingService cdx = new CycloneDxParsingService();
        var cdxOm = CycloneDxParsingService.class.getDeclaredField("objectMapper");
        cdxOm.setAccessible(true);
        cdxOm.set(cdx, om);
        var cdxField = ExhortResponseParser.class.getDeclaredField("cycloneDxParsingService");
        cdxField.setAccessible(true);
        cdxField.set(parser, cdx);
    }

    @Test
    void cveFound_throwsWhenCyclonedxBlank() {
        String json = "{\"providers\":{\"rhtpa\":{\"status\":{\"ok\":true,\"warnings\":{}},\"sources\":{}}}}";
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", ""));
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", "   "));
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", (String) null));
    }

    @Test
    void cveFound_throwsWhenCyclonedxNotObject() {
        String json = "{\"providers\":{\"rhtpa\":{\"status\":{\"ok\":true,\"warnings\":{}},\"sources\":{}}}}";
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", "[]"));
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", "\"x\""));
    }

    @Test
    void cveFound_throwsWhenCyclonedxInvalidJson() {
        String json = "{\"providers\":{\"rhtpa\":{\"status\":{\"ok\":true,\"warnings\":{}},\"sources\":{}}}}";
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", "not-json"));
    }

    @Test
    void cveFound_throwsWhenProvidersMissing() {
        String json = "{\"scanned\":{\"total\":1}}";
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", minimalCyclonedx()));
    }

    @Test
    void cveFound_throwsWhenProvidersEmpty() {
        String json = "{\"providers\":{}}";
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", minimalCyclonedx()));
    }

    @Test
    void cveFound_throwsWhenStatusOkFalse() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":false,"warnings":{}},"sources":{}}}}
                """;
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", minimalCyclonedx()));
    }

    @Test
    void cveFound_throwsWhenWarningsNonEmptyObject() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{"pkg:maven/x":["a"]}},"sources":{}}}}
                """;
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", minimalCyclonedx()));
    }

    @Test
    void cveFound_throwsWhenWarningsNonEmptyArray() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":["x"]},"sources":{}}}}
                """;
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", minimalCyclonedx()));
    }

    @Test
    void cveFound_falseWhenCleanAndNoIssues() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{}},"sources":{}}}}
                """;
        assertFalse(parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", minimalCyclonedx()));
    }

    @Test
    void cveFound_trueWhenCveOnlyInOtherProvider() {
        String json =
                """
                {"providers":{
                  "other":{"status":{"ok":true,"warnings":{}},"sources":{"s":{"dependencies":[
                    {"issues":[{"cves":["CVE-ONLY-HERE"]}],"transitive":[]}
                  ]}}},"rhtpa":{"status":{"ok":true,"warnings":{}},"sources":{}}}
                }
                """;
        assertTrue(parser.cveFoundInAnalysisResponse(json, "CVE-ONLY-HERE", minimalCyclonedx()));
    }

    @Test
    void cveFound_trueWhenIssueIdMatches() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{}},"sources":{"s":{"dependencies":[
                  {"issues":[{"id":"CVE-MATCH-ID"}],"transitive":[]}
                ]}}}}}
                """;
        assertTrue(parser.cveFoundInAnalysisResponse(json, "CVE-MATCH-ID", minimalCyclonedx()));
    }

    @Test
    void cveFound_trueInTransitive() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{}},"sources":{"s":{"dependencies":[
                  {"issues":[],"transitive":[{"issues":[{"cves":["CVE-TRANS"]}],"transitive":[]}]}
                ]}}}}}
                """;
        assertTrue(parser.cveFoundInAnalysisResponse(json, "CVE-TRANS", minimalCyclonedx()));
    }

    @Test
    void cveFound_nullSourcesTreatedAsClean() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{}}}}}
                """;
        assertFalse(parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", minimalCyclonedx()));
    }

    @Test
    void cveFound_ignoresSyftMainModuleWarningsOnly() {
        String cdx =
                cyclonedxWithSyftMainModule(
                        "github.com/foo/app", "pkg:golang/github.com/foo/app?package-id=abc");
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{
                  "pkg:golang/github.com/foo/app":["Unable to process: missing version component"]
                }},"sources":{}}}}
                """;
        assertFalse(parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", cdx));
    }

    @Test
    void cveFound_mainModuleWarningIgnoredStillDetectsCve() {
        String cdx =
                cyclonedxWithSyftMainModule(
                        "github.com/foo/app", "pkg:golang/github.com/foo/app?package-id=abc");
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{
                  "pkg:golang/github.com/foo/app":["Unable to process: missing version component"]
                }},"sources":{"s":{"dependencies":[
                  {"issues":[{"id":"CVE-GATE"}],"transitive":[]}
                ]}}}}}
                """;
        assertTrue(parser.cveFoundInAnalysisResponse(json, "CVE-GATE", cdx));
    }

    @Test
    void cveFound_mixedWarningsStillFails() {
        String cdx =
                cyclonedxWithSyftMainModule(
                        "github.com/foo/app", "pkg:golang/github.com/foo/app?package-id=abc");
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{
                  "pkg:golang/github.com/foo/app":["x"],
                  "pkg:maven/other":["y"]
                }},"sources":{}}}}
                """;
        assertThrows(ExhortCveGateException.class, () -> parser.cveFoundInAnalysisResponse(json, "CVE-2024-1", cdx));
    }

    @Test
    void collectCveIds_includesCvesAndIds() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{}},"sources":{"s":{"dependencies":[
                  {"issues":[{"id":"CVE-A","cves":["CVE-B"]}],"transitive":[]}
                ]}}}}}
                """;
        Set<String> ids = parser.collectCveIdsFromAnalysisResponse(json, minimalCyclonedx());
        assertTrue(ids.contains("CVE-A"));
        assertTrue(ids.contains("CVE-B"));
    }

    @Test
    void collectCveIds_emptyWhenNoSources() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{}}}}}
                """;
        assertTrue(parser.collectCveIdsFromAnalysisResponse(json, minimalCyclonedx()).isEmpty());
    }

    @Test
    void collectCveIds_throwsWhenCyclonedxMissing() {
        String json =
                """
                {"providers":{"rhtpa":{"status":{"ok":true,"warnings":{}}}}}
                """;
        assertThrows(ExhortCveGateException.class, () -> parser.collectCveIdsFromAnalysisResponse(json, ""));
    }
}
