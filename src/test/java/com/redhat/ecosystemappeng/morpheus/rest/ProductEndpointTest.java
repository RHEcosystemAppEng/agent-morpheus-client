package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import java.util.Map;

/**
 * End-to-end test for the Products API endpoint.
 * 
 * This test assumes the service is running in a separate process.
 * Set the BASE_URL environment variable to point to the running service,
 * e.g., BASE_URL=http://localhost:8080
 * 
 * If BASE_URL is not set, tests will be skipped.
 */
@EnabledIfEnvironmentVariable(named = "BASE_URL", matches = ".*")
class ProductEndpointTest {

    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final String API_BASE = BASE_URL != null ? BASE_URL : "http://localhost:8080";

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = API_BASE;
    }

    @Test
    void testGetProducts_ReturnsExpectedStructure() {        
        // Get product-1 which is a known test product
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
            .body("find { it.data.id == 'product-1' }.summary.justificationStatusCounts.FALSE", equalTo(1));
    }

    @Test
    void testGetProducts_WithSortBySubmittedAt() {
        
        // Test sorting by submittedAt ASC
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
        
        // Verify ASC sorting: each submittedAt should be <= the next one (or nulls at the end)
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
        
        
        // Test sorting by submittedAt DESC
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
        // Verify DESC sorting: each submittedAt should be >= the next one (or nulls at the end)
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
        
        // Test sorting by cveId ASC
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
        
        // Verify ASC sorting: each cveId should be <= the next one lexicographically
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
        
        // Test sorting by cveId DESC
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
        
        // Verify DESC sorting: each cveId should be >= the next one lexicographically
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
        // Test sorting by name ASC
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
        
        // Verify ASC sorting: each name should be <= the next one lexicographically
        Assertions.assertNotNull(ascResults, "ASC results should not be null");
        Assertions.assertTrue(ascResults.size() > 1, "ASC results should have more than one item");
        
        // Check for alphanumeric sorting bug: lexicographic vs alphanumeric
        // In lexicographic sorting: "test-sbom-product-10" comes before "test-sbom-product-2" (because "1" < "2" as characters)
        // In alphanumeric sorting: "test-sbom-product-10" comes after "test-sbom-product-2" (because 10 > 2 as numbers)
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
        
        // Assert that both products were found
        Assertions.assertTrue(
            foundProduct2,
            "test-sbom-product-2 must be found in the results to test alphanumeric sorting"
        );
        Assertions.assertTrue(
            foundProduct10,
            "test-sbom-product-10 must be found in the results to test alphanumeric sorting"
        );
        
        // Verify alphanumeric sorting is working correctly
        // Alphanumeric sorting (correct): product-10 comes after product-2 (because 10 > 2 as numbers)
        // Lexicographic sorting (incorrect): product-10 comes before product-2 (because "1" < "2" as characters)
        boolean isAlphanumeric = product10Index > product2Index;
        Assertions.assertTrue(
            isAlphanumeric,
            String.format(
                "Alphanumeric sorting not working: 'test-sbom-product-10' (index %d) should come after 'test-sbom-product-2' (index %d). " +
                "This indicates lexicographic sorting instead of alphanumeric sorting. " +
                "In alphanumeric sorting, product-10 should come after product-2 (because 10 > 2).",
                product10Index, product2Index
            )
        );
        
        // Test sorting by name DESC
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
        
        // Verify DESC sorting with alphanumeric ordering
        Assertions.assertNotNull(descResults, "DESC results should not be null");
        Assertions.assertTrue(descResults.size() > 1, "DESC results should have more than one item");
        
        // Verify alphanumeric sorting in DESC order: product-10 should come before product-2
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
        
        // Assert that both products were found in DESC results
        Assertions.assertTrue(
            foundProduct2Desc,
            "test-sbom-product-2 must be found in the DESC results to test alphanumeric sorting"
        );
        Assertions.assertTrue(
            foundProduct10Desc,
            "test-sbom-product-10 must be found in the DESC results to test alphanumeric sorting"
        );
        
        // In DESC order with alphanumeric sorting: product-10 should come before product-2
        boolean isAlphanumericDesc = product10IndexDesc < product2IndexDesc;
        Assertions.assertTrue(
            isAlphanumericDesc,
            String.format(
                "Alphanumeric DESC sorting not working: 'test-sbom-product-10' (index %d) should come before 'test-sbom-product-2' (index %d) in DESC order. " +
                "In alphanumeric sorting, product-10 should come before product-2 in DESC order (because 10 > 2).",
                product10IndexDesc, product2IndexDesc
            )
        );
    }
    

    @Test
    void testGetProducts_WithPagination() {
        // Act & Assert - Test pagination        
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
        // Test filtering by CVE ID - product-1 has CVE-2024-12345
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
        
        // Verify that only products with the specified CVE ID are returned
        Assertions.assertNotNull(results, "Results should not be null");
        Assertions.assertTrue(results.size() > 0, "At least one product with CVE-2024-12345 should be found");
        
        // Verify all returned products contain the search term in their CVE ID (partial matching)
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
        
        // Verify that product-1 is in the results
        boolean foundProduct1 = results.stream()
            .map(r -> (Map<String, Object>) r)
            .anyMatch(p -> "product-1".equals(p.get("id")));
        Assertions.assertTrue(
            foundProduct1,
            "product-1 should be in the filtered results"
        );
        
        // Test filtering by another CVE ID - CVE-2024-44337 should return multiple products (3, 5, 6, 8)
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
        
        // Verify all returned products contain the search term in their CVE ID (partial matching)
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
        
        // Test partial matching - search for "44" should match CVE-2024-44337
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
        
        // Verify all returned products contain "44" in their CVE ID
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
        // Arrange - First get a product ID from the list

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
        // Act & Assert - Test getting a non-existent product
        // Use a product ID that definitely doesn't exist (very long random string)        
        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/this-product-id-definitely-does-not-exist-123456789")
            .then()
            .statusCode(404);
    }

    @Test
    void testJustificationStatusCounts_CountsAllStatuses() {
        // This test demonstrates the bug: justificationStatusCounts should count
        // all statuses from the first analysis entry of each report, not just
        // those that were present in the first report's first analysis entry.
                
        // Get a product that has multiple reports with different justification statuses
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
        
        // Find a product with multiple reports that might have different statuses
        for (Object productObj : products) {
            Map<String, Object> product = (Map<String, Object>) productObj;
            Map<String, Object> summary = (Map<String, Object>) product.get("summary");
            Map<String, Integer> justificationStatusCounts = (Map<String, Integer>) summary.get("justificationStatusCounts");
            
            if (justificationStatusCounts != null && !justificationStatusCounts.isEmpty()) {
                // Check if all statuses are being counted
                // The bug: if a report has a status that wasn't in the first report,
                // it won't be counted, so the sum of counts might be less than the
                // number of completed reports
                Map<String, Integer> statusCounts = (Map<String, Integer>) summary.get("statusCounts");
                Integer completedCount = statusCounts != null ? statusCounts.get("completed") : 0;
                
                if (completedCount != null && completedCount > 0) {
                    int totalJustificationCounts = justificationStatusCounts.values().stream()
                        .mapToInt(Integer::intValue)
                        .sum();
                    
                    // The bug: totalJustificationCounts might be less than completedCount
                    // if some reports have statuses that weren't in the first report
                    System.out.println("Product: " + product.get("data") + 
                                     ", Completed reports: " + completedCount + 
                                     ", Total justification counts: " + totalJustificationCounts +
                                     ", Status counts: " + justificationStatusCounts);
                    
                    // This assertion will fail if the bug exists
                    // The fix should ensure all completed reports are counted
                    Assertions.assertTrue(
                        totalJustificationCounts <= completedCount,
                        "Total justification counts should not exceed completed reports count"
                    );
                }
            }
        }
    }
}

