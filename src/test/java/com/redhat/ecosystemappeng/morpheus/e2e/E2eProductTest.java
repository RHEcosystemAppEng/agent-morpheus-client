package com.redhat.ecosystemappeng.morpheus.e2e;

import com.redhat.ecosystemappeng.morpheus.test.ProductTestScenarios;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.jboss.logging.Logger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end test client for Product API.
 * 
 * This is a standalone Java test that can be run against a running Quarkus server.
 * 
 * Usage:
 *   1. Start Quarkus in dev mode: mvn quarkus:dev
 *   2. Run this test: mvn test -Dtest=E2eProductTest
 * 
 * Or run as a standalone Java application:
 *   java -cp target/test-classes:target/classes:... com.redhat.ecosystemappeng.morpheus.e2e.E2eProductTest
 */
public class E2eProductTest {
    
    private static final Logger LOG = Logger.getLogger(E2eProductTest.class);
    private static final String BASE_URL = System.getProperty("e2e.base.url", "http://localhost:8080");
    private static final String TEST_FILE = "spdx_sboms/gitops-1.19.json";
    
    private ProductTestScenarios scenarios;
    
    /**
     * Check if the server is running by making a request to /api/v1/reports
     * Any HTTP response (even errors) indicates the server is running
     */
    private static boolean isServerRunning(String baseUrl) {
        try {
            Response response = given()
                .baseUri(baseUrl)
                .when()
                .get("/api/v1/reports");
            
            // Any HTTP response (even 401/403/404) means server is running
            int statusCode = response.getStatusCode();
            if (statusCode >= 200 && statusCode < 600) {
                LOG.debugf("Server is responding at %s/api/v1/reports (status: %d)", baseUrl, statusCode);
                return true;
            }
        } catch (Exception e) {
            // Check if it's a connection error (server not running)
            Throwable cause = e.getCause();
            if (cause instanceof java.net.ConnectException || 
                cause instanceof java.net.UnknownHostException ||
                e.getMessage() != null && (
                    e.getMessage().contains("Connection refused") ||
                    e.getMessage().contains("Unknown host") ||
                    e.getMessage().contains("Connection timed out"))) {
                LOG.debugf("Connection failed to %s: %s", baseUrl, e.getMessage());
                return false;
            }
            LOG.debugf("API endpoint check failed: %s", e.getMessage());
        }
        
        LOG.warnf("Server does not appear to be running at %s", baseUrl);
        return false;
    }
    
    @BeforeEach
    public void setUp() {
        this.scenarios = new ProductTestScenarios(BASE_URL);
        LOG.infof("Initialized E2E test with base URL: %s", BASE_URL);
        
        // Verify server is running before each test
        if (!isServerRunning(BASE_URL)) {
            throw new IllegalStateException(
                String.format("Server is not running at %s. Please start Quarkus first: mvn quarkus:dev", BASE_URL));
        }
    }
    
    /**
     * Main method for standalone execution (not via Maven/JUnit)
     */
    public static void main(String[] args) {
        LOG.info("=========================================");
        LOG.info("Starting E2E Product API Tests (Standalone)");
        LOG.info("Base URL: " + BASE_URL);
        LOG.info("=========================================");
        
        // Verify server is running before starting tests
        if (!isServerRunning(BASE_URL)) {
            LOG.errorf("Server is not running at %s", BASE_URL);
            LOG.error("Please start Quarkus first: mvn quarkus:dev");
            System.exit(1);
        }
        
        LOG.info("✓ Server is running, starting tests...");
        
        E2eProductTest test = new E2eProductTest();
        test.setUp(); // Initialize scenarios
        
        int failures = 0;
        
        failures += test.runTest("testComprehensiveProductWithVulnerabilityId", test::testComprehensiveProductWithVulnerabilityId) ? 0 : 1;
        failures += test.runTest("testCreateProductWithoutVulnerabilityIdFails", test::testCreateProductWithoutVulnerabilityIdFails) ? 0 : 1;
        
        LOG.info("=========================================");
        if (failures == 0) {
            LOG.info("All tests passed!");
            System.exit(0);
        } else {
            LOG.errorf("Tests completed with %d failure(s)", failures);
            System.exit(1);
        }
    }
    
    private boolean runTest(String testName, Runnable test) {
        try {
            LOG.infof("Running test: %s", testName);
            test.run();
            LOG.infof("✓ Test passed: %s", testName);
            return true;
        } catch (AssertionError | Exception e) {
            LOG.errorf("✗ Test failed: %s - %s", testName, e.getMessage());
            if (e.getCause() != null) {
                LOG.errorf("Cause: %s", e.getCause().getMessage());
            }
            return false;
        }
    }
    
    @Test
    public void testComprehensiveProductWithVulnerabilityId() {
        String vulnerabilityId = "CVE-2024-12345";
        Map<String, Response> responses = scenarios.scenarioComprehensiveProductTest(
            TEST_FILE, vulnerabilityId, 2000);
        
        // 1. Verify product creation
        Response createResponse = responses.get("createProduct");
        createResponse.then()
            .statusCode(202)
            .contentType(ContentType.JSON)
            .body("productId", notNullValue());
        
        String productId = createResponse.jsonPath().getString("productId");
        assertNotNull(productId, "Product ID should not be null");
        
        // 2. Verify reports are created immediately (no wait)
        Response reportsByProductImmediate = responses.get("reportsByProductImmediate");
        reportsByProductImmediate.then().statusCode(200);
        int immediateTotalElements = reportsByProductImmediate.jsonPath().getInt("totalElements");
        assertTrue(immediateTotalElements > 0, "Reports should be created immediately and queryable");
        
        // 3. Verify reports have pending status initially
        Response reportsByStatus = responses.get("reportsByStatus");
        reportsByStatus.then().statusCode(200);
        int pendingCount = reportsByStatus.jsonPath().getInt("totalElements");
        assertTrue(pendingCount > 0, "Reports should have 'pending' status when first created");
        
        // 4. Verify report metadata
        Response getReport = responses.get("getReport");
        if (getReport != null) {
            getReport.then().statusCode(200);
            String componentName = getReport.jsonPath().getString("metadata.component_name");
            assertNotNull(componentName, "Report should have component_name in metadata");
        }
        
        // 5. Verify product does not have status field (status is computed from reports)
        Response getProduct = responses.get("getProduct");
        getProduct.then().statusCode(200);
        String status = getProduct.jsonPath().getString("status");
        assertNull(status, "Product should not have status field (status is computed from reports)");
        
        // 6. Verify reports are queryable by product ID (after processing)
        Response reportsByProduct = responses.get("reportsByProduct");
        reportsByProduct.then().statusCode(200);
        int totalElements = reportsByProduct.jsonPath().getInt("totalElements");
        assertTrue(totalElements > 0, "At least one report should exist");
        
        // 7. Verify reports are queryable by vulnerability ID
        Response reportsByVulnId = responses.get("reportsByVulnId");
        reportsByVulnId.then().statusCode(200);
        int vulnReportsCount = reportsByVulnId.jsonPath().getInt("totalElements");
        assertTrue(vulnReportsCount > 0, "Reports should be queryable by vulnerability ID");
        
        // 8. Verify product status is computed from reports
        Response getProductSummary = responses.get("getProductSummary");
        getProductSummary.then().statusCode(200);
        String computedStatus = getProductSummary.jsonPath().getString("productReportsSummary.productState");
        assertNotNull(computedStatus, "Product status should be computed from reports");
        assertTrue(computedStatus.equals("analysing") || computedStatus.equals("completed"), 
            "Product status should be 'analysing' or 'completed'");
    }
    
    @Test
    public void testCreateProductWithoutVulnerabilityIdFails() {
        Response response = scenarios.scenarioCreateProductWithoutVulnerabilityId(TEST_FILE);
        
        response.then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("error", containsString("vulnerabilityId is required"));
    }
}

