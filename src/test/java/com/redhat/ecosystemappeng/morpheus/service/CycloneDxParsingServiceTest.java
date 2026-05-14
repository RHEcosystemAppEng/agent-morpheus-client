package com.redhat.ecosystemappeng.morpheus.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CycloneDxParsingServiceTest {

    private CycloneDxParsingService service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws Exception {
        service = new CycloneDxParsingService();
        objectMapper = new ObjectMapper();
        var f = CycloneDxParsingService.class.getDeclaredField("objectMapper");
        f.setAccessible(true);
        f.set(service, objectMapper);
    }

    @Test
    void basePurlForExhortWarningMatch_stripsQuery() {
        assertEquals(
                "pkg:golang/foo/bar",
                CycloneDxParsingService.basePurlForExhortWarningMatch("pkg:golang/foo/bar?package-id=xyz"));
        assertEquals("pkg:golang/foo/bar", CycloneDxParsingService.basePurlForExhortWarningMatch("pkg:golang/foo/bar"));
    }

    @Test
    void collectSyftMainModuleBasePurls_findsMainModuleRow() throws Exception {
        String json =
                """
                {"components":[{
                  "type":"library",
                  "name":"github.com/foo/app",
                  "purl":"pkg:golang/github.com/foo/app?package-id=abc",
                  "properties":[{"name":"syft:metadata:mainModule","value":"github.com/foo/app"}]
                },{
                  "type":"library",
                  "name":"github.com/other/dep",
                  "purl":"pkg:golang/github.com/other/dep@v1.0.0",
                  "properties":[{"name":"syft:metadata:mainModule","value":"github.com/foo/app"}]
                }]}
                """;
        var root = objectMapper.readTree(json);
        var bases = service.collectSyftMainModuleBasePurls(root);
        assertEquals(1, bases.size());
        assertTrue(bases.contains("pkg:golang/github.com/foo/app"));
    }

    @Test
    void collectSyftMainModuleBasePurls_emptyWhenNoComponentsArray() throws Exception {
        var root = objectMapper.readTree("{\"components\":{}}");
        assertTrue(service.collectSyftMainModuleBasePurls(root).isEmpty());
    }
}
