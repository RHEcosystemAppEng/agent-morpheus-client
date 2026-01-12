package com.redhat.ecosystemappeng.morpheus.rest;

import com.redhat.ecosystemappeng.morpheus.test.ProductTestScenarios;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.jboss.logging.Logger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import static org.hamcrest.CoreMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ProductEndpointTest {

    private static final Logger LOG = Logger.getLogger(ProductEndpointTest.class);
    private ProductTestScenarios scenarios;
    private static final String TEST_FILE = "spdx_sboms/gitops-1.19.json";

    @BeforeEach
    public void setUp() {
        // In QuarkusTest, baseUrl is empty (relative paths)
        scenarios = new ProductTestScenarios("", ProductEndpointTest.class);
    }

    @Test
    public void testComprehensiveProductWithVulnerabilityId() {
        try {
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
            
        } catch (Exception e) {
            logException(e);
            throw new RuntimeException(e);
        }
    }
    
    @Test
    public void testCreateProductWithoutVulnerabilityIdFails() {
        try {
            Response response = scenarios.scenarioCreateProductWithoutVulnerabilityId(TEST_FILE);
            
            try {
                response.then()
                    .statusCode(400)
                    .contentType(ContentType.JSON)
                    .body("error", containsString("vulnerabilityId is required"));
            } catch (AssertionError e) {
                LOG.errorf("Test assertion failed.%s", scenarios.formatFullResponse(response));
                logException(e);
                throw e;
            }
        } catch (Exception e) {
            logException(e);
            throw new RuntimeException(e);
        }
    }
    
    private void logException(Throwable e) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        e.printStackTrace(pw);
        LOG.errorf("Test failed with exception: %s%nFull stack trace:%n%s", e.getMessage(), sw.toString());
    }
}

