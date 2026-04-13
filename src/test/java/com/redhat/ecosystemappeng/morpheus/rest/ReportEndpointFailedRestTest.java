package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * {@code POST /api/v1/reports/failed} HTTP tests ({@link io.quarkus.test.junit.QuarkusTest}).
 */
@QuarkusTest
public class ReportEndpointFailedRestTest {

    @BeforeEach
    void restAssuredBase() {
        RestApiTestFixture.configureRestAssuredIfExternal();
    }

    private static final String EXISTING_SCAN_ID = "test-scan-no-output-info";
    private static final String NON_EXISTENT_SCAN_ID = "non-existent-scan-id-12345";

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
