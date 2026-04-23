package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import java.util.Map;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * HTTP tests for the products / product-summary API ({@link io.quarkus.test.junit.QuarkusTest}).
 */
@QuarkusTest
public class ProductEndpointRestTest {

    @BeforeEach
    void restAssuredBase() {
        RestApiTestFixture.configureRestAssuredIfExternal();
    }

    @Test
    void testGetProducts_ReturnsExpectedStructure() {
        RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThan(1))
            .body("data.id", hasItem("product-1"))
            .body("find { it.data.id == 'product-1' }.data.name", equalTo("test-sbom-product-1"))
            .body("find { it.data.id == 'product-1' }.data.cveId", equalTo("CVE-2024-12345"))
            .body("find { it.data.id == 'product-1' }.summary.statusCounts.completed", equalTo(2))
            .body("find { it.data.id == 'product-1' }.summary.justificationStatusCounts.TRUE", equalTo(1))
            .body("find { it.data.id == 'product-1' }.summary.justificationStatusCounts.FALSE", equalTo(1))
            .body("find { it.data.id == 'product-2' }.summary.singleComponentFlowScanId",
                equalTo("c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f"));
    }

    @Test
    void testGetProducts_WithSortBySubmittedAt() {

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
            .body("size()", greaterThan(1))
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
            .body("size()", greaterThan(1))
            .extract()
            .jsonPath()
            .getList("data.submittedAt", String.class);
        Assertions.assertNotNull(descResults, "DESC results should not be null");
        Assertions.assertTrue(descResults.size() > 1, "DESC results should have more than one item");

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
    void testGetProducts_WithSortByCveId() {

        var ascResults = RestAssured.given()
            .when()
            .queryParam("sortField", "cveId")
            .queryParam("sortDirection", "ASC")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThan(1))
            .extract()
            .jsonPath()
            .getList("data.cveId", String.class);

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
            .queryParam("sortField", "cveId")
            .queryParam("sortDirection", "DESC")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThan(1))
            .extract()
            .jsonPath()
            .getList("data.cveId", String.class);

        Assertions.assertNotNull(descResults, "DESC results should not be null");
        Assertions.assertTrue(descResults.size() > 1, "DESC results should have more than one item");
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
    void testGetProducts_WithSortByName() {
        var ascResults = RestAssured.given()
            .when()
            .queryParam("sortField", "name")
            .queryParam("sortDirection", "ASC")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThan(1))
            .extract()
            .jsonPath()
            .getList("data.name", String.class);

        Assertions.assertNotNull(ascResults, "ASC results should not be null");
        Assertions.assertTrue(ascResults.size() > 1, "ASC results should have more than one item");

        boolean foundProduct10 = false;
        boolean foundProduct2 = false;
        int product10Index = -1;
        int product2Index = -1;

        for (int i = 0; i < ascResults.size(); i++) {
            String name = ascResults.get(i);
            if (name != null) {
                if (name.equals("test-sbom-product-10")) {
                    foundProduct10 = true;
                    product10Index = i;
                }
                if (name.equals("test-sbom-product-2")) {
                    foundProduct2 = true;
                    product2Index = i;
                }
            }
        }

        Assertions.assertTrue(
            foundProduct2,
            "test-sbom-product-2 must be found in the results to test alphanumeric sorting"
        );
        Assertions.assertTrue(
            foundProduct10,
            "test-sbom-product-10 must be found in the results to test alphanumeric sorting"
        );

        boolean isAlphanumeric = product10Index > product2Index;
        Assertions.assertTrue(
            isAlphanumeric,
            String.format(
                "Alphanumeric sorting not working: 'test-sbom-product-10' (index %d) should come after 'test-sbom-product-2' (index %d). "
                    +
                    "This indicates lexicographic sorting instead of alphanumeric sorting. "
                    +
                    "In alphanumeric sorting, product-10 should come after product-2 (because 10 > 2).",
                product10Index, product2Index
            )
        );

        var descResults = RestAssured.given()
            .when()
            .queryParam("sortField", "name")
            .queryParam("sortDirection", "DESC")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThan(1))
            .extract()
            .jsonPath()
            .getList("data.name", String.class);

        Assertions.assertNotNull(descResults, "DESC results should not be null");
        Assertions.assertTrue(descResults.size() > 1, "DESC results should have more than one item");

        boolean foundProduct10Desc = false;
        boolean foundProduct2Desc = false;
        int product10IndexDesc = -1;
        int product2IndexDesc = -1;

        for (int i = 0; i < descResults.size(); i++) {
            String name = descResults.get(i);
            if (name != null) {
                if (name.equals("test-sbom-product-10")) {
                    foundProduct10Desc = true;
                    product10IndexDesc = i;
                }
                if (name.equals("test-sbom-product-2")) {
                    foundProduct2Desc = true;
                    product2IndexDesc = i;
                }
            }
        }

        Assertions.assertTrue(
            foundProduct2Desc,
            "test-sbom-product-2 must be found in the DESC results to test alphanumeric sorting"
        );
        Assertions.assertTrue(
            foundProduct10Desc,
            "test-sbom-product-10 must be found in the DESC results to test alphanumeric sorting"
        );

        boolean isAlphanumericDesc = product10IndexDesc < product2IndexDesc;
        Assertions.assertTrue(
            isAlphanumericDesc,
            String.format(
                "Alphanumeric DESC sorting not working: 'test-sbom-product-10' (index %d) should come before 'test-sbom-product-2' (index %d) in DESC order. "
                    +
                    "In alphanumeric sorting, product-10 should come before product-2 in DESC order (because 10 > 2).",
                product10IndexDesc, product2IndexDesc
            )
        );
    }

    @Test
    void testGetProducts_WithPagination() {
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
            .body("size()", equalTo(5));
    }

    @Test
    void testGetProducts_WithCveIdFilter() {
        var results = RestAssured.given()
            .when()
            .queryParam("cveId", "CVE-2024-12345")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .jsonPath()
            .getList("data", Map.class);

        Assertions.assertNotNull(results, "Results should not be null");
        Assertions.assertTrue(results.size() > 0, "At least one product with CVE-2024-12345 should be found");

        for (Object result : results) {
            @SuppressWarnings("unchecked")
            Map<String, Object> product = (Map<String, Object>) result;
            String cveId = (String) product.get("cveId");
            Assertions.assertNotNull(cveId, "CVE ID should not be null");
            Assertions.assertTrue(
                cveId.contains("12345"),
                String.format("CVE ID '%s' should contain '12345'", cveId)
            );
        }

        boolean foundProduct1 = results.stream()
            .map(r -> (Map<String, Object>) r)
            .anyMatch(p -> "product-1".equals(p.get("id")));
        Assertions.assertTrue(
            foundProduct1,
            "product-1 should be in the filtered results"
        );

        var results2 = RestAssured.given()
            .when()
            .queryParam("cveId", "CVE-2024-44337")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .jsonPath()
            .getList("data", Map.class);

        Assertions.assertNotNull(results2, "Results should not be null");
        Assertions.assertTrue(
            results2.size() > 1,
            "Multiple products with CVE-2024-44337 should be found (products 3, 5, 6, 8)"
        );

        for (Object result : results2) {
            @SuppressWarnings("unchecked")
            Map<String, Object> product = (Map<String, Object>) result;
            String cveId = (String) product.get("cveId");
            Assertions.assertNotNull(cveId, "CVE ID should not be null");
            Assertions.assertTrue(
                cveId.contains("44337"),
                String.format("CVE ID '%s' should contain '44337'", cveId)
            );
        }

        var results3 = RestAssured.given()
            .when()
            .queryParam("cveId", "44")
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .jsonPath()
            .getList("data", Map.class);

        Assertions.assertNotNull(results3, "Results should not be null");
        Assertions.assertTrue(
            results3.size() > 0,
            "At least one product with '44' in CVE ID should be found (e.g., CVE-2024-44337)"
        );

        for (Object result : results3) {
            @SuppressWarnings("unchecked")
            Map<String, Object> product = (Map<String, Object>) result;
            String cveId = (String) product.get("cveId");
            Assertions.assertNotNull(cveId, "CVE ID should not be null");
            Assertions.assertTrue(
                cveId.contains("44"),
                String.format("CVE ID '%s' should contain '44'", cveId)
            );
        }
    }

    @Test
    void testGetProductById_ReturnsExpectedStructure() {
        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/product-1")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.id", equalTo("product-1"))
            .body("data.name", equalTo("test-sbom-product-1"))
            .body("summary.statusCounts", equalTo(java.util.Map.of("completed", 2)))
            .body("summary.justificationStatusCounts", equalTo(java.util.Map.of("TRUE", 1, "FALSE", 1)))
            .body("summary.productState", equalTo("completed"));
    }

    @Test
    void testGetProductById_NotFound() {
        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/this-product-id-definitely-does-not-exist-123456789")
            .then()
            .statusCode(404);
    }

    @Test
    void testJustificationStatusCounts_CountsAllStatuses() {
        var response = RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/product")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThan(1))
            .extract()
            .response();

        var products = response.jsonPath().getList("$");
        Assertions.assertNotNull(products, "Products list should not be null");
        Assertions.assertTrue(products.size() > 1, "Products list should have more than one item");

        for (Object productObj : products) {
            @SuppressWarnings("unchecked")
            Map<String, Object> product = (Map<String, Object>) productObj;
            @SuppressWarnings("unchecked")
            Map<String, Object> summary = (Map<String, Object>) product.get("summary");
            @SuppressWarnings("unchecked")
            Map<String, Integer> justificationStatusCounts = (Map<String, Integer>) summary.get("justificationStatusCounts");

            if (justificationStatusCounts != null && !justificationStatusCounts.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Integer> statusCounts = (Map<String, Integer>) summary.get("statusCounts");
                Integer completedCount = statusCounts != null ? statusCounts.get("completed") : 0;

                if (completedCount != null && completedCount > 0) {
                    int totalJustificationCounts = justificationStatusCounts.values().stream()
                        .mapToInt(Integer::intValue)
                        .sum();

                    Assertions.assertTrue(
                        totalJustificationCounts <= completedCount,
                        "Total justification counts should not exceed completed reports count"
                    );
                }
            }
        }
    }
}
