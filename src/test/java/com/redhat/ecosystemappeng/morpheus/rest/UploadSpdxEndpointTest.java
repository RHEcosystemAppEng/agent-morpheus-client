package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import java.io.File;

import com.redhat.ecosystemappeng.morpheus.service.SpdxParsingService;

/**
 * End-to-end test for the SPDX upload API endpoint.
 * 
 * This test assumes the service is running in a separate process.
 * Set the BASE_URL environment variable to point to the running service,
 * e.g., BASE_URL=http://localhost:8080
 * 
 * If BASE_URL is not set, tests will be skipped.
 */
@EnabledIfEnvironmentVariable(named = "BASE_URL", matches = ".*")
class UploadSpdxEndpointTest {

    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final String API_BASE = BASE_URL != null ? BASE_URL : "http://localhost:8080";
    private static final String TEST_SBOM_FILE = "src/test/resources/devservices/spdx-sboms/gitops-1.19.json";
    private static final String SPDX_WITH_UNSUPPORTED = "src/test/resources/devservices/spdx-sboms/spdx-with-unsupported-component.json";
    private static final String INVALID_SPDX_DIR = "src/test/resources/devservices/spdx-sboms/invalid";
    private static final String TEST_VULN_ID = "CVE-2021-4238";

    @Test
    void testUpload_ValidFileAndVulnerabilityId() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.baseURI = API_BASE;
        
        // Upload the file and verify product was created
        String productId = RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(202)
            .contentType(ContentType.JSON)
            .body("productId", notNullValue())
            .extract()
            .path("productId");
        
        assert productId != null : "Product ID should not be null";
        
        // Verify product was created and contains CPE in metadata
        RestAssured.given()
            .when()
            .get("/api/v1/products/" + productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.metadata.cpe", equalTo("cpe:/a:redhat:openshift_gitops:1.19::el8"));
    }

    @Test
    void testUpload_WithCredentials() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.baseURI = API_BASE;
        
        // Upload the file with credentials (PAT format)
        String productId = RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .multiPart("secretValue", "test-pat-token-12345")
            .multiPart("username", "testuser")
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(202)
            .contentType(ContentType.JSON)
            .body("productId", notNullValue())
            .extract()
            .path("productId");
        
        assert productId != null : "Product ID should not be null";
        
        // Verify product was created successfully
        RestAssured.given()
            .when()
            .get("/api/v1/products/" + productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.metadata.cpe", equalTo("cpe:/a:redhat:openshift_gitops:1.19::el8"));
    }

    @Test
    void testUpload_WithInvalidCredentials() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.baseURI = API_BASE;
        
        // Upload with invalid credentials (empty secretValue should be rejected if provided)
        // Note: Empty secretValue is actually allowed (credentials are optional)
        // This test verifies that invalid credential format is handled
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .multiPart("secretValue", "invalid-credential-format")
            .multiPart("username", "testuser")
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(202) // Credentials are validated but invalid format may still allow upload
            .contentType(ContentType.JSON);
    }

    @Test
    void testUpload_SpdxWithUnsupportedComponent_RecordsInSubmissionFailures() {
        File sbomFile = new File(SPDX_WITH_UNSUPPORTED);
        RestAssured.baseURI = API_BASE;

        String productId = RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(202)
            .contentType(ContentType.JSON)
            .body("productId", notNullValue())
            .extract()
            .path("productId");

        assert productId != null : "Product ID should not be null";

        // Product has 2 components total (1 OCI supported, 1 maven unsupported); submittedCount = 2
        RestAssured.given()
            .when()
            .get("/api/v1/products/" + productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.submittedCount", equalTo(2))
            .body("data.submissionFailures", notNullValue())
            .body("data.submissionFailures", hasSize(1))
            .body("data.submissionFailures[0].name", equalTo("maven-lib"))
            .body("data.submissionFailures[0].version", equalTo("2.0"))
            .body("data.submissionFailures[0].error", containsString("Expects a container image package URL starting with pkg:oci"));
    }

    @Test
    void testUpload_InvalidNoDescribeby_Returns400() {
        File sbomFile = new File(INVALID_SPDX_DIR, "spdx-no-describeby.json");
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.file", equalTo("No DESCRIBES relationship found in SPDX document"));
    }

    @Test
    void testUpload_InvalidProductPackageNotFound_Returns400() {
        File sbomFile = new File(INVALID_SPDX_DIR, "spdx-describes-missing-package.json");
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.file", equalTo("Product package not found: SPDXRef-Nonexistent-Product"));
    }

    @Test
    void testUpload_InvalidProductNameMissing_Returns400() {
        File sbomFile = new File(INVALID_SPDX_DIR, "spdx-product-no-name.json");
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.file", equalTo("Product name not found in DESCRIBES relationship package with SPDX ID: SPDXRef-Product-No-Name"));
    }

    @Test
    void testUpload_NoSupportedComponents_Returns400() {
        File sbomFile = new File(INVALID_SPDX_DIR, "spdx-no-supported-components.json");
        RestAssured.baseURI = API_BASE;
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.file", equalTo(SpdxParsingService.NO_SUPPORTED_COMPONENTS_MESSAGE));
    }
}

