package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * End-to-end test for the grouped reports API endpoint.
 * 
 * This test assumes the service is running in a separate process.
 * Set the BASE_URL environment variable to point to the running service,
 * e.g., BASE_URL=http://localhost:8080
 * 
 * If BASE_URL is not set, tests will be skipped.
 */
@EnabledIfEnvironmentVariable(named = "BASE_URL", matches = ".*")
class GroupedReportsEndpointTest {

    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final String API_BASE = BASE_URL != null ? BASE_URL : "http://localhost:8080";

    @Test
    void testGetGroupedReports_ReturnsExpectedStructure() {
        // Act & Assert - Verify the API returns the expected structure
        RestAssured.baseURI = API_BASE;
        var size = RestAssured.given()
            .when()
            .queryParam("sortField", "completedAt")
            .queryParam("sortDirection", "DESC")
            .queryParam("page", 0)
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Pages", notNullValue())
            .header("X-Total-Elements", notNullValue())
            .body("$", isA(java.util.List.class))
            .body("size()", greaterThanOrEqualTo(0))
            .extract()
            .path("size()");
        
        // If there are results, verify structure of first item
        if (size != null && (Integer) size > 0) {
            RestAssured.given()
                .when()
                .queryParam("sortField", "completedAt")
                .queryParam("sortDirection", "DESC")
                .queryParam("page", 0)
                .queryParam("pageSize", 100)
                .get("/api/v1/reports/grouped")
                .then()
                .body("[0].productId", notNullValue())
                .body("[0].sbomName", anyOf(nullValue(), isA(String.class)))
                .body("[0].cveId", anyOf(nullValue(), isA(String.class)))
                .body("[0].cveStatusCounts", isA(java.util.Map.class))
                .body("[0].statusCounts", isA(java.util.Map.class))
                .body("[0].completedAt", anyOf(nullValue(), isA(String.class)))
                .body("[0].numReports", isA(Integer.class));
        }
    }

    @Test
    void testGetGroupedReports_WithDefaultParameters() {
        // Act & Assert - Test with default parameters
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .when()
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Pages", notNullValue())
            .header("X-Total-Elements", notNullValue())
            .body("$", isA(java.util.List.class));
    }

    @Test
    void testGetGroupedReports_WithSortBySbomName() {
        // Act & Assert - Test sorting by sbomName
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .when()
            .queryParam("sortField", "sbomName")
            .queryParam("sortDirection", "ASC")
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class));
    }

    @Test
    void testGetGroupedReports_WithPagination() {
        // Act & Assert - Test pagination
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 5)
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Pages", notNullValue())
            .header("X-Total-Elements", notNullValue())
            .body("$", isA(java.util.List.class))
            .body("size()", lessThanOrEqualTo(5));
    }

    @Test
    void testGetGroupedReports_VerifyProductIdExists() {
        // Act & Assert - Verify that all returned items have productId
        RestAssured.baseURI = API_BASE;
        var size = RestAssured.given()
            .when()
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .path("size()");
        
        // Only verify productId if there are results
        if (size != null && (Integer) size > 0) {
            RestAssured.given()
                .when()
                .get("/api/v1/reports/grouped")
                .then()
                .body("productId", everyItem(notNullValue()));
        }
    }

    @Test
    void testGetGroupedReports_VerifyCountsAreNonNegative() {
        // Act & Assert - Verify that counts are non-negative integers
        RestAssured.baseURI = API_BASE;
        var size = RestAssured.given()
            .when()
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", isA(java.util.List.class))
            .extract()
            .path("size()");
        
        // Only verify numReports if there are results
        if (size != null && (Integer) size > 0) {
            RestAssured.given()
                .when()
                .get("/api/v1/reports/grouped")
                .then()
                .body("numReports", everyItem(greaterThanOrEqualTo(0)));
        }
    }
}

