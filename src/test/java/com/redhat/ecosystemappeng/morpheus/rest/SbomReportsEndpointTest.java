package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.Assertions;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * End-to-end test for the SBOM reports API endpoint.
 * 
 * This test assumes the service is running in a separate process.
 * Set the BASE_URL environment variable to point to the running service,
 * e.g., BASE_URL=http://localhost:8080
 * 
 * If BASE_URL is not set, tests will be skipped.
 */
@EnabledIfEnvironmentVariable(named = "BASE_URL", matches = ".*")
class SbomReportsEndpointTest {

    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final String API_BASE = BASE_URL != null ? BASE_URL : "http://localhost:8080";

    @Test
    void testGetSbomReports_ReturnsExpectedStructure() {
      
        RestAssured.given()
            .when()
            .queryParam("sortField", "submittedAt")
            .queryParam("sortDirection", "DESC")
            .queryParam("page", 0)
            .queryParam("pageSize", 100)
            .get("/api/v1/sbom-reports")
            .then()
            .body("[0].sbomReportId", equalTo("product-4"))
            .body("[0].sbomName", equalTo("Product_4"))
            .body("[0].cveId", equalTo("CVE-2024-1485"))
            .body("[0].cveStatusCounts", equalTo(java.util.Map.of("FALSE", 1, "UNKNOWN", 1)))
            .body("[0].statusCounts", equalTo(java.util.Map.of("completed", 2)))
            .body("[0].completedAt", equalTo("2025-02-24T07:12:15.038386"))
            .body("[0].submittedAt", equalTo("2025-02-24T07:11:41.123Z"))
            .body("[0].numReports", equalTo(2))
            .body("[0].firstReportId", is(notNullValue()));
        
    }

    @Test
    void testGetSbomReports_WithSortBySubmittedAt() {
        RestAssured.baseURI = API_BASE;
        
        // Test sorting by submittedAt ASC
        var ascResults = RestAssured.given()
            .when()
            .queryParam("sortField", "submittedAt")
            .queryParam("sortDirection", "ASC")
            .queryParam("pageSize", 100)
            .get("/api/v1/sbom-reports")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .jsonPath()
            .getList("submittedAt", String.class);
        
        // Verify ASC sorting: each submittedAt should be <= the next one (or nulls at the end)
        if (ascResults != null && ascResults.size() > 1) {
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
        }
        
        // Test sorting by submittedAt DESC
        var descResults = RestAssured.given()
            .when()
            .queryParam("sortField", "submittedAt")
            .queryParam("sortDirection", "DESC")
            .queryParam("pageSize", 100)
            .get("/api/v1/sbom-reports")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .jsonPath()
            .getList("submittedAt", String.class);    
        // Verify DESC sorting: each submittedAt should be >= the next one (or nulls at the end)
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
        // Act & Assert - Test pagination
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 5)
            .get("/api/v1/sbom-reports")
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
        // Arrange - First get a SBOM report ID from the list
        String sbomReportId = "product-1";
    
        RestAssured.given()
            .when()
            .get("/api/v1/sbom-reports/{sbomReportId}", sbomReportId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("sbomReportId", equalTo(sbomReportId))
            .body("sbomName", equalTo("test-sbom-product-1"))
            .body("cveId", equalTo("CVE-2024-12345"))
            .body("cveStatusCounts", equalTo(java.util.Map.of("FALSE", 1, "TRUE", 1)))
            .body("statusCounts", equalTo(java.util.Map.of("completed", 2)))
            .body("completedAt", equalTo("2026-01-26T11:05:00.000000") )
            .body("submittedAt", equalTo("2025-01-15T09:00:00Z"))
            .body("numReports", equalTo(2))
            .body("firstReportId", is(notNullValue()));
    
    }

    @Test
    void testGetSbomReportById_NotFound() {
        // Act & Assert - Test getting a non-existent SBOM report
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .when()
            .get("/api/v1/sbom-reports/nonexistent-sbom-report-id")
            .then()
            .statusCode(404);
    }

    @Test
    void testFirstReportId_CanBeRetrievedFromDatabase() {
        // Arrange - Get a SBOM report with firstReportId
        RestAssured.baseURI = API_BASE;
        var firstReportId = RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 1)
            .get("/api/v1/sbom-reports")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .path("[0].firstReportId");
        
        Assertions.assertNotNull(firstReportId, "First report ID should not be null");
        System.out.println("First report ID: " + firstReportId);
        // Act & Assert - Verify firstReportId can be used to fetch the report from database
        RestAssured.given()
            .when()
            .get("/api/v1/reports/" + firstReportId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body(notNullValue());
        
    }
}

