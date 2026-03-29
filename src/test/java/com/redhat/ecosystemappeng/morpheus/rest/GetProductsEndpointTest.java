package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.Assertions;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * End-to-end tests for product summaries exposed under the reports API
 * ({@code GET /api/v1/reports/product} and {@code GET /api/v1/reports/product/{id}}).
 * <p>
 * Historically this class targeted a removed {@code /api/v1/sbom-reports} surface; it now
 * validates the consolidated product summary endpoints.
 * <p>
 * Requires a running service and seed data. Set {@code BASE_URL}, e.g.
 * {@code BASE_URL=http://localhost:8080}. If unset, tests are skipped.
 */
@EnabledIfEnvironmentVariable(named = "BASE_URL", matches = ".*")
class GetProductsEndpointTest {

    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final String API_BASE = BASE_URL != null ? BASE_URL : "http://localhost:8080";

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = API_BASE;
    }

    @Test
    void testGetSbomReports_ReturnsExpectedStructure() {
        RestAssured.given()
            .when()
            .queryParam("sortField", "submittedAt")
            .queryParam("sortDirection", "DESC")
            .queryParam("page", 0)
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThan(0))
            .body("find { it.data.id == 'product-1' }.data.id", equalTo("product-1"))
            .body("find { it.data.id == 'product-1' }.data.name", equalTo("test-sbom-product-1"))
            .body("find { it.data.id == 'product-1' }.data.cveId", equalTo("CVE-2024-12345"))
            .body("find { it.data.id == 'product-1' }.summary.statusCounts.completed", equalTo(2))
            .body("find { it.data.id == 'product-1' }.summary.justificationStatusCounts.TRUE", equalTo(1))
            .body("find { it.data.id == 'product-1' }.summary.justificationStatusCounts.FALSE", equalTo(1))
            .body("find { it.data.id == 'product-2' }.summary.singleComponentFlowScanId",
                equalTo("c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f"));
    }

    @Test
    void testGetSbomReports_WithSortBySubmittedAt() {
        var ascResults = RestAssured.given()
            .when()
            .queryParam("sortField", "submittedAt")
            .queryParam("sortDirection", "ASC")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .jsonPath()
            .getList("data.submittedAt", String.class);

        Assertions.assertNotNull(ascResults, "ASC results should not be null");
        Assertions.assertTrue(ascResults.size() > 1, "ASC results should have more than one item");
        for (int i = 0; i < ascResults.size() - 1; i++) {
            String current = ascResults.get(i);
            String next = ascResults.get(i + 1);
            if (current != null && next != null) {
                Assertions.assertTrue(
                    current.compareTo(next) <= 0,
                    String.format("ASC sort failed: %s should be <= %s at index %d", current, next, i)
                );
            }
        }

        var descResults = RestAssured.given()
            .when()
            .queryParam("sortField", "submittedAt")
            .queryParam("sortDirection", "DESC")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .jsonPath()
            .getList("data.submittedAt", String.class);

        Assertions.assertNotNull(descResults, "DESC results should not be null");
        Assertions.assertTrue(descResults.size() > 1, "DESC results should have at least 2 items");
        for (int i = 0; i < descResults.size() - 1; i++) {
            String current = descResults.get(i);
            String next = descResults.get(i + 1);
            if (current != null && next != null) {
                Assertions.assertTrue(
                    current.compareTo(next) >= 0,
                    String.format("DESC sort failed: %s should be >= %s at index %d", current, next, i)
                );
            }
        }
    }

    @Test
    void testGetSbomReports_WithPagination() {
        RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 5)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Pages", notNullValue())
            .header("X-Total-Elements", notNullValue())
            .body("$", isA(java.util.List.class))
            .body("size()", lessThanOrEqualTo(5));
    }

    @Test
    void testGetSbomReportById_ReturnsExpectedStructure() {
        String productId = "product-1";

        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/{id}", productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.id", equalTo(productId))
            .body("data.name", equalTo("test-sbom-product-1"))
            .body("data.cveId", equalTo("CVE-2024-12345"))
            .body("summary.statusCounts", equalTo(java.util.Map.of("completed", 2)))
            .body("summary.justificationStatusCounts", equalTo(java.util.Map.of("FALSE", 1, "TRUE", 1)));
    }

    @Test
    void testGetSbomReportById_NotFound() {
        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/nonexistent-sbom-report-id")
            .then()
            .statusCode(404);
    }

    @Test
    void testFirstReportId_CanBeRetrievedFromDatabase() {
        var reportId = RestAssured.given()
            .when()
            .queryParam("productId", "product-1")
            .queryParam("page", 0)
            .queryParam("pageSize", 1)
            .get("/api/v1/reports")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .path("[0].id");

        Assertions.assertNotNull(reportId, "Report ID should not be null");
        RestAssured.given()
            .when()
            .get("/api/v1/reports/{id}", reportId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body(notNullValue());
    }
}
