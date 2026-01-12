package com.redhat.ecosystemappeng.morpheus.test;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.jboss.logging.Logger;

import java.io.File;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;

/**
 * Shared test scenarios for Product API tests.
 * Contains all REST API calls for each test scenario without assertions.
 * Can be used by both JUnit tests and standalone E2E test clients.
 */
public class ProductTestScenarios {
    
    private static final Logger LOG = Logger.getLogger(ProductTestScenarios.class);
    private final String baseUrl;
    private final Class<?> resourceClass;
    
    /**
     * Constructor for use in JUnit tests (uses classpath resources)
     */
    public ProductTestScenarios(String baseUrl, Class<?> resourceClass) {
        this.baseUrl = baseUrl != null ? baseUrl : "";
        this.resourceClass = resourceClass;
    }
    
    /**
     * Constructor for standalone E2E tests (uses filesystem)
     */
    public ProductTestScenarios(String baseUrl) {
        this.baseUrl = baseUrl != null ? baseUrl : "";
        this.resourceClass = null;
    }
    
    /**
     * Get test file from classpath or filesystem
     */
    private File getTestFile(String resourcePath) {
        if (resourceClass != null) {
            // Try classpath first (for JUnit tests)
            URL resource = resourceClass.getClassLoader().getResource(resourcePath);
            if (resource != null) {
                return new File(resource.getFile());
            }
        }
        
        // Fallback to filesystem (for E2E tests)
        File file = new File("src/test/resources/" + resourcePath);
        if (file.exists()) {
            return file;
        }
        
        // Try absolute path from project root
        file = new File(System.getProperty("user.dir") + "/src/test/resources/" + resourcePath);
        if (file.exists()) {
            return file;
        }
        
        throw new IllegalArgumentException("Test file not found: " + resourcePath);
    }
    
    /**
     * Wait for async processing to complete
     */
    public void waitForAsyncProcessing(long milliseconds) {
        try {
            LOG.infof("Waiting %d ms for async processing...", milliseconds);
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOG.warn("Wait interrupted", e);
        }
    }
    
    /**
     * Format response for debugging
     */
    public String formatFullResponse(Response response) {
        StringBuilder responseDetails = new StringBuilder();
        responseDetails.append("\n=== FULL RESPONSE DETAILS ===\n");
        responseDetails.append("Status Code: ").append(response.getStatusCode()).append("\n");
        responseDetails.append("Status Line: ").append(response.getStatusLine()).append("\n");
        responseDetails.append("Content Type: ").append(response.getContentType()).append("\n");
        responseDetails.append("\n--- Response Headers ---\n");
        response.getHeaders().forEach(header -> 
            responseDetails.append(header.getName()).append(": ").append(header.getValue()).append("\n")
        );
        responseDetails.append("\n--- Response Body ---\n");
        responseDetails.append(response.getBody().asString());
        responseDetails.append("\n==============================\n");
        return responseDetails.toString();
    }
    
    /**
     * Test scenario: Create product from SPDX file with vulnerability ID (required)
     * Returns the response from creating the product
     */
    public Response scenarioCreateProductFromSpdxFile(String testFile, String vulnerabilityId) {
        LOG.infof("Scenario: Creating product from file: %s with vulnerabilityId: %s", testFile, vulnerabilityId);
        File spdxFile = getTestFile(testFile);
        
        return given()
            .baseUri(baseUrl)
            .contentType(ContentType.MULTIPART)
            .multiPart("file", spdxFile)
            .queryParam("vulnerabilityId", vulnerabilityId)
            .when()
            .post("/api/v1/product/new");
    }
    
    /**
     * Test scenario: Create product with vulnerability ID
     * Returns the response from creating the product
     */
    public Response scenarioCreateProductWithVulnerabilityId(String testFile, String vulnerabilityId) {
        LOG.infof("Scenario: Creating product from file: %s with vulnerabilityId: %s", testFile, vulnerabilityId);
        File spdxFile = getTestFile(testFile);
        
        return given()
            .baseUri(baseUrl)
            .contentType(ContentType.MULTIPART)
            .multiPart("file", spdxFile)
            .queryParam("vulnerabilityId", vulnerabilityId)
            .when()
            .post("/api/v1/product/new");
    }
    
    /**
     * Test scenario: Attempt to create product without vulnerability ID (should fail)
     * Returns the response from creating the product (expected to be 400 Bad Request)
     */
    public Response scenarioCreateProductWithoutVulnerabilityId(String testFile) {
        LOG.infof("Scenario: Attempting to create product from file: %s without vulnerabilityId (should fail)", testFile);
        File spdxFile = getTestFile(testFile);
        
        return given()
            .baseUri(baseUrl)
            .contentType(ContentType.MULTIPART)
            .multiPart("file", spdxFile)
            .when()
            .post("/api/v1/product/new");
    }
    
    /**
     * Test scenario: Get reports by product ID
     * Returns the response with reports
     */
    public Response scenarioGetReportsByProductId(String productId) {
        LOG.infof("Scenario: Getting reports for product: %s", productId);
        return given()
            .baseUri(baseUrl)
            .queryParam("product_id", productId)
            .when()
            .get("/api/v1/reports");
    }
    
    /**
     * Test scenario: Get reports by product ID and status
     * Returns the response with reports
     */
    public Response scenarioGetReportsByProductIdAndStatus(String productId, String status) {
        LOG.infof("Scenario: Getting reports for product: %s with status: %s", productId, status);
        return given()
            .baseUri(baseUrl)
            .queryParam("product_id", productId)
            .queryParam("status", status)
            .when()
            .get("/api/v1/reports");
    }
    
    /**
     * Test scenario: Get reports by vulnerability ID
     * Returns the response with reports
     */
    public Response scenarioGetReportsByVulnId(String vulnId) {
        LOG.infof("Scenario: Getting reports by vulnerability ID: %s", vulnId);
        return given()
            .baseUri(baseUrl)
            .queryParam("vulnId", vulnId)
            .when()
            .get("/api/v1/reports");
    }
    
    /**
     * Test scenario: Get reports by vulnerability ID and product ID
     * Returns the response with reports
     */
    public Response scenarioGetReportsByVulnIdAndProductId(String vulnId, String productId) {
        LOG.infof("Scenario: Getting reports by vulnerability ID: %s and product: %s", vulnId, productId);
        return given()
            .baseUri(baseUrl)
            .queryParam("vulnId", vulnId)
            .queryParam("product_id", productId)
            .when()
            .get("/api/v1/reports");
    }
    
    /**
     * Test scenario: Get product by ID
     * Returns the response with product data
     */
    public Response scenarioGetProduct(String productId) {
        LOG.infof("Scenario: Getting product: %s", productId);
        return given()
            .baseUri(baseUrl)
            .when()
            .get("/api/v1/product/" + productId);
    }
    
    /**
     * Test scenario: Get product summary (includes computed status from reports)
     * Returns the response with product summary
     */
    public Response scenarioGetProductSummary(String productId) {
        LOG.infof("Scenario: Getting product summary for: %s", productId);
        return given()
            .baseUri(baseUrl)
            .when()
            .get("/api/v1/reports/product/" + productId);
    }
    
    /**
     * Test scenario: Get report by ID
     * Returns the response with report data
     */
    public Response scenarioGetReport(String reportId) {
        LOG.infof("Scenario: Getting report: %s", reportId);
        return given()
            .baseUri(baseUrl)
            .when()
            .get("/api/v1/reports/" + reportId);
    }
    
    /**
     * Complete test scenario: Create product with vulnerability ID and verify reports
     * Returns a map containing all responses:
     * - "createProduct": Response from creating product
     * - "reportsByProduct": Response from getting reports by product ID
     * - "reportsByVulnId": Response from getting reports by vulnerability ID
     */
    public Map<String, Response> scenarioCreateProductWithVulnIdAndVerifyReports(
            String testFile, String vulnerabilityId, long waitTimeMs) {
        LOG.infof("Complete scenario: Create product with vulnerability ID and verify reports");
        Map<String, Response> responses = new HashMap<>();
        
        // Create product
        Response createResponse = scenarioCreateProductWithVulnerabilityId(testFile, vulnerabilityId);
        responses.put("createProduct", createResponse);
        
        String productId = createResponse.jsonPath().getString("productId");
        if (productId == null) {
            return responses; // Can't continue without product ID
        }
        
        // Wait for async processing
        waitForAsyncProcessing(waitTimeMs);
        
        // Get reports by product ID
        Response reportsByProduct = scenarioGetReportsByProductId(productId);
        responses.put("reportsByProduct", reportsByProduct);
        
        // Get reports by vulnerability ID
        Response reportsByVulnId = scenarioGetReportsByVulnIdAndProductId(vulnerabilityId, productId);
        responses.put("reportsByVulnId", reportsByVulnId);
        
        return responses;
    }
    
    /**
     * Complete test scenario: Create product without vulnerability ID and verify
     * Returns a map containing all responses:
     * - "createProduct": Response from creating product
     * - "reportsByProduct": Response from getting reports by product ID
     * - "reportsByRandomVulnId": Response from getting reports by random CVE (should be empty)
     */
    public Map<String, Response> scenarioCreateProductWithoutVulnIdAndVerify(
            String testFile, long waitTimeMs) {
        LOG.infof("Complete scenario: Create product without vulnerability ID and verify");
        Map<String, Response> responses = new HashMap<>();
        
        // Create product
        Response createResponse = scenarioCreateProductWithoutVulnerabilityId(testFile);
        responses.put("createProduct", createResponse);
        
        String productId = createResponse.jsonPath().getString("productId");
        if (productId == null) {
            return responses; // Can't continue without product ID
        }
        
        // Wait for async processing
        waitForAsyncProcessing(waitTimeMs);
        
        // Get reports by product ID
        Response reportsByProduct = scenarioGetReportsByProductId(productId);
        responses.put("reportsByProduct", reportsByProduct);
        
        // Get reports by random CVE (should return empty)
        Response reportsByRandomVulnId = scenarioGetReportsByVulnId("CVE-2024-99999");
        responses.put("reportsByRandomVulnId", reportsByRandomVulnId);
        
        return responses;
    }
    
    /**
     * Complete test scenario: Verify product status is computed from reports
     * Returns a map containing all responses:
     * - "createProduct": Response from creating product
     * - "getProduct": Response from getting product (should not have status field)
     * - "getProductSummary": Response from getting product summary (status computed from reports)
     */
    public Map<String, Response> scenarioVerifyProductStatusComputedFromReports(
            String testFile, String vulnerabilityId, long waitTimeMs) {
        LOG.infof("Complete scenario: Verify product status is computed from reports");
        Map<String, Response> responses = new HashMap<>();
        
        // Create product
        Response createResponse = scenarioCreateProductFromSpdxFile(testFile, vulnerabilityId);
        responses.put("createProduct", createResponse);
        
        String productId = createResponse.jsonPath().getString("productId");
        if (productId == null) {
            return responses; // Can't continue without product ID
        }
        
        // Get product directly (should not have status field)
        Response getProduct = scenarioGetProduct(productId);
        responses.put("getProduct", getProduct);
        
        // Wait for async processing
        waitForAsyncProcessing(waitTimeMs);
        
        // Get product summary (status computed from reports)
        Response getProductSummary = scenarioGetProductSummary(productId);
        responses.put("getProductSummary", getProductSummary);
        
        return responses;
    }
    
    /**
     * Complete test scenario: Verify reports are created immediately
     * Returns a map containing all responses:
     * - "createProduct": Response from creating product
     * - "reportsByProduct": Response from getting reports immediately (no wait)
     * - "reportsByStatus": Response from getting reports with pending status
     * - "getReport": Response from getting first report to check metadata
     */
    public Map<String, Response> scenarioVerifyReportsCreatedImmediately(String testFile, String vulnerabilityId) {
        LOG.infof("Complete scenario: Verify reports are created immediately");
        Map<String, Response> responses = new HashMap<>();
        
        // Create product
        Response createResponse = scenarioCreateProductFromSpdxFile(testFile, vulnerabilityId);
        responses.put("createProduct", createResponse);
        
        String productId = createResponse.jsonPath().getString("productId");
        if (productId == null) {
            return responses; // Can't continue without product ID
        }
        
        // Immediately get reports (no waiting)
        Response reportsByProduct = scenarioGetReportsByProductId(productId);
        responses.put("reportsByProduct", reportsByProduct);
        
        // Get reports with pending status
        Response reportsByStatus = scenarioGetReportsByProductIdAndStatus(productId, "pending");
        responses.put("reportsByStatus", reportsByStatus);
        
        // Get first report to check metadata
        int totalElements = reportsByProduct.jsonPath().getInt("totalElements");
        if (totalElements > 0) {
            String firstReportId = reportsByProduct.jsonPath().getString("content[0].id");
            if (firstReportId != null) {
                Response getReport = scenarioGetReport(firstReportId);
                responses.put("getReport", getReport);
            }
        }
        
        return responses;
    }
    
    /**
     * Complete comprehensive test scenario: Create product with vulnerability ID and verify all aspects
     * This single scenario performs all verifications:
     * - Product creation with vulnerability ID
     * - Reports created immediately (queryable right away)
     * - Reports queryable by product ID
     * - Reports queryable by vulnerability ID
     * - Product status computed from reports (not stored in product)
     * - Vulnerability ID preserved in reports
     * - Reports have pending status initially
     * - Report metadata is correct
     * 
     * Returns a map containing all responses:
     * - "createProduct": Response from creating product
     * - "reportsByProductImmediate": Response from getting reports immediately (no wait)
     * - "reportsByStatus": Response from getting reports with pending status
     * - "getReport": Response from getting first report to check metadata
     * - "getProduct": Response from getting product (should not have status field)
     * - "reportsByProduct": Response from getting reports by product ID (after wait)
     * - "reportsByVulnId": Response from getting reports by vulnerability ID
     * - "getProductSummary": Response from getting product summary (status computed from reports)
     */
    public Map<String, Response> scenarioComprehensiveProductTest(
            String testFile, String vulnerabilityId, long waitTimeMs) {
        LOG.infof("Complete comprehensive scenario: Create product with vulnerability ID and verify all aspects");
        Map<String, Response> responses = new HashMap<>();
        
        // 1. Create product with vulnerability ID
        Response createResponse = scenarioCreateProductWithVulnerabilityId(testFile, vulnerabilityId);
        responses.put("createProduct", createResponse);
        
        String productId = createResponse.jsonPath().getString("productId");
        if (productId == null) {
            return responses; // Can't continue without product ID
        }
        
        // 2. Immediately get reports (no waiting) - verify they're created right away
        Response reportsByProductImmediate = scenarioGetReportsByProductId(productId);
        responses.put("reportsByProductImmediate", reportsByProductImmediate);
        
        // 3. Get reports with pending status
        Response reportsByStatus = scenarioGetReportsByProductIdAndStatus(productId, "pending");
        responses.put("reportsByStatus", reportsByStatus);
        
        // 4. Get first report to check metadata
        int totalElements = reportsByProductImmediate.jsonPath().getInt("totalElements");
        if (totalElements > 0) {
            String firstReportId = reportsByProductImmediate.jsonPath().getString("content[0].id");
            if (firstReportId != null) {
                Response getReport = scenarioGetReport(firstReportId);
                responses.put("getReport", getReport);
            }
        }
        
        // 5. Get product directly (should not have status field)
        Response getProduct = scenarioGetProduct(productId);
        responses.put("getProduct", getProduct);
        
        // 6. Wait for async processing
        waitForAsyncProcessing(waitTimeMs);
        
        // 7. Get reports by product ID (after processing)
        Response reportsByProduct = scenarioGetReportsByProductId(productId);
        responses.put("reportsByProduct", reportsByProduct);
        
        // 8. Get reports by vulnerability ID (should still be queryable)
        Response reportsByVulnId = scenarioGetReportsByVulnIdAndProductId(vulnerabilityId, productId);
        responses.put("reportsByVulnId", reportsByVulnId);
        
        // 9. Get product summary (status computed from reports)
        Response getProductSummary = scenarioGetProductSummary(productId);
        responses.put("getProductSummary", getProductSummary);
        
        return responses;
    }
}

