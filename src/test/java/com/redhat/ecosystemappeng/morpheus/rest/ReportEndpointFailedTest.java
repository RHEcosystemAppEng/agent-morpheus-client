package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * End-to-end test for the Report API endpoint (POST /api/v1/reports/failed).
 *
 * This test assumes the service is running in a separate process with devservices data loaded.
 * Set the BASE_URL environment variable to point to the running service,
 * e.g., BASE_URL=http://localhost:8080
 *
 * If BASE_URL is not set, tests will be skipped.
 */
@EnabledIfEnvironmentVariable(named = "BASE_URL", matches = ".*")
class ReportEndpointFailedTest {

    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final String API_BASE = BASE_URL != null ? BASE_URL : "http://localhost:8080";

    /** Scan ID that exists in devservices (test-single-repo-1.json). */
    private static final String EXISTING_SCAN_ID = "test-scan-no-output-info";
    /** Scan ID that does not exist in devservices. */
    private static final String NON_EXISTENT_SCAN_ID = "non-existent-scan-id-12345";

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = API_BASE;
    }

    @Test
    void testPostFailed_returns202AndScanIdInBody() {
        Map<String, String> body = Map.of(
            "scanId", EXISTING_SCAN_ID,
            "errorType", "processing-error",
            "errorMessage", "Test failure from ReportEndpointFailedTest"
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post("/api/v1/reports/failed")
            .then()
            .statusCode(202)
            .body(equalTo(EXISTING_SCAN_ID));
    }

    @Test
    void testPostFailed_returns404WhenScanIdNotFound() {
        Map<String, String> body = Map.of(
            "scanId", NON_EXISTENT_SCAN_ID,
            "errorType", "processing-error",
            "errorMessage", "Should not be applied"
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post("/api/v1/reports/failed")
            .then()
            .statusCode(404);            
    }
}
