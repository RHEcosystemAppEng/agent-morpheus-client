package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.equalTo;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * {@code GET /api/v1/reports} filtering by {@code inputType} ({@link io.quarkus.test.junit.QuarkusTest} + devservices data).
 */
@QuarkusTest
class ReportListInputTypeRestTest {

    /**
     * Seed: {@code src/test/resources/devservices/reports/rpm.json}; identify row by
     * {@code input.image.target_package} NVR (not {@code scan.id}, which varies per document).
     */
    static final String RPM_DEVSERVICES_PACKAGE_NVR = "libarchive-3.1.2-14.el7_9.1";
    /** Seed: {@code src/test/resources/devservices/reports/test-single-repo-1.json}. */
    static final String STANDALONE_REPOSITORY_SCAN_ID = "test-single-repo-1";

    @BeforeEach
    void restAssuredBase() {
        RestApiTestFixture.configureRestAssuredIfExternal();
    }

    static List<Map<String, Object>> listReports(Map<String, Object> queryParams) {
        var req = RestAssured.given();
        queryParams.forEach((k, v) -> req.queryParam(k, v));
        return req.when()
            .get("/api/v1/reports")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .extract()
            .jsonPath()
            .getList("$");
    }

    static boolean metadataHasProductId(Map<String, Object> reportRow) {
        Object mdObj = reportRow.get("metadata");
        if (!(mdObj instanceof Map<?, ?> md)) {
            return false;
        }
        Object pid = md.get("product_id");
        Object camel = md.get("productId");
        return (pid != null && !(pid instanceof String s && s.isEmpty()))
            || (camel != null && !(camel instanceof String s2 && s2.isEmpty()));
    }

    @Test
    void listReports_inputTypeRpm_containsDevservicesRpmStandaloneRow_andAllRowsMatchFilter() {
        List<Map<String, Object>> reports = listReports(
            Map.of("inputType", "rpm", "pageSize", 500));

        Assertions.assertTrue(
            reports.stream().anyMatch(r -> RPM_DEVSERVICES_PACKAGE_NVR.equals(r.get("rpmPackage"))),
            "expected devservices rpm.json report in inputType=rpm results (match by target_package NVR)");

        for (Map<String, Object> r : reports) {
            Object pkg = r.get("rpmPackage");
            Assertions.assertTrue(
                pkg instanceof String s && !s.isBlank(),
                "expected RPM tab rows to expose rpmPackage (derived from target_package); rpmPackage="
                    + r.get("rpmPackage"));
            Assertions.assertFalse(metadataHasProductId(r), "rpmPackage=" + r.get("rpmPackage"));
        }
    }

    @Test
    void listReports_inputTypeRepository_containsDevservicesStandaloneRepo_andExcludesRpmTabRow() {
        List<Map<String, Object>> reports = listReports(
            Map.of("inputType", "repository", "pageSize", 500));

        Assertions.assertTrue(
            reports.stream().anyMatch(r -> STANDALONE_REPOSITORY_SCAN_ID.equals(r.get("scanId"))),
            "expected test-single-repo-1 in inputType=repository results");

        Assertions.assertTrue(
            reports.stream().noneMatch(r -> RPM_DEVSERVICES_PACKAGE_NVR.equals(r.get("rpmPackage"))),
            "RPM checker devservices row must not appear for inputType=repository");

        for (Map<String, Object> r : reports) {
            Object pkg = r.get("rpmPackage");
            Assertions.assertTrue(
                !(pkg instanceof String s && !s.isBlank()),
                "repository rows must not carry RPM package NVR from target_package; rpmPackage="
                    + r.get("rpmPackage"));
            Assertions.assertFalse(metadataHasProductId(r), "scanId=" + r.get("scanId"));
        }
    }

    @Test
    void listReports_inputTypeInvalid_returns400() {
        RestAssured.given()
            .queryParam("inputType", "sbom")
            .when()
            .get("/api/v1/reports")
            .then()
            .statusCode(400)
            .body("error", equalTo("inputType must be repository or rpm if provided"));
    }

    /** Devservices {@code rpm.json} exposes {@code libarchive-3.1.2-14.el7_9.1}. */
    @Test
    void listReports_inputTypeRpm_rpmPackageSubstring_matchesSeedRow() {
        List<Map<String, Object>> reports = listReports(
            Map.of("inputType", "rpm", "pageSize", 500, "rpmPackage", "libarchive"));

        Assertions.assertTrue(
            reports.stream().anyMatch(r -> RPM_DEVSERVICES_PACKAGE_NVR.equals(r.get("rpmPackage"))),
            "expected rpmPackage filter to keep libarchive seed row (exact NVR from target_package)");
    }

    @Test
    void listReports_inputTypeRpm_rpmPackageCrossFieldSubstring_matchesSeedRow() {
        List<Map<String, Object>> reports = listReports(
            Map.of("inputType", "rpm", "pageSize", 500, "rpmPackage", "archive-3.1"));

        Assertions.assertTrue(
            reports.stream().anyMatch(r -> RPM_DEVSERVICES_PACKAGE_NVR.equals(r.get("rpmPackage"))),
            "substring spanning name into version must match joined N-V-R");
    }

    @Test
    void listReports_inputTypeRpm_rpmPackageNoMatch_returnsEmptyResults() {
        List<Map<String, Object>> reports = listReports(
            Map.of(
                "inputType", "rpm",
                "pageSize", 500,
                "rpmPackage", "zzzzz-no-matching-package-nvr-substring"));

        Assertions.assertEquals(0, reports.size(), "only one seeded RPM row exists; filter must exclude it");
    }
}

