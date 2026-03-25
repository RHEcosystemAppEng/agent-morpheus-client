package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import java.io.File;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.redhat.ecosystemappeng.morpheus.service.SpdxParsingService;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * SPDX upload HTTP tests ({@link io.quarkus.test.junit.QuarkusTest}).
 */
@QuarkusTest
public class UploadSpdxRestTest {

    private static final String TEST_SBOM_FILE = "src/test/resources/devservices/spdx-sboms/gitops-1.19-stripped.json";
    private static final String SPDX_WITH_UNSUPPORTED = "src/test/resources/devservices/spdx-sboms/spdx-with-unsupported-component.json";
    private static final String INVALID_SPDX_DIR = "src/test/resources/devservices/spdx-sboms/invalid";
    private static final String TEST_VULN_ID = "CVE-2007-4559";

    /** {@code gitops-1.19-stripped.json}: ten OCI {@code PACKAGE_OF} children; SPDXIDs use {@code SPDXRef-test-component-*} for readable debug paths. */
    private static final int GITOPS_119_EXPECTED_SUBMITTED_COUNT = 10;

    /** Exactly one component ({@code gitops-operator-bundle-1-19}) is recorded in excluded components (e.g. Syft/SBOM validation). */
    private static final int GITOPS_119_EXPECTED_EXCLUDED_COMPONENT_COUNT = 9;

    /**
     * Successful Morpheus-backed reports after async processing:
     * {@link #GITOPS_119_EXPECTED_SUBMITTED_COUNT} submitted =
     * {@link #GITOPS_119_EXPECTED_REPORT_COUNT} reports + {@link #GITOPS_119_EXPECTED_SUBMISSION_FAILURE_COUNT} failure(s).
     */
    private static final int GITOPS_119_EXPECTED_REPORT_COUNT =
        GITOPS_119_EXPECTED_SUBMITTED_COUNT - GITOPS_119_EXPECTED_EXCLUDED_COMPONENT_COUNT;

    /**
     * Valid SPDX upload for {@code gitops-1.19.json}: expects product CPE, 12 submitted components,
     * 11 persisted reports, and exactly one entry in {@code excludedComponents} (operator bundle).
     */
    @Test
    void testUpload_ValidFileAndVulnerabilityId() {
        File sbomFile = new File(TEST_SBOM_FILE);

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

        Assertions.assertNotNull(productId, "Product ID should not be null");
        RestApiTestFixture.awaitSpdxProductProcessingComplete(productId);

        RestAssured.given()
            .when()
            .get("/api/v1/products/" + productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.dependencyTriageUnavailable", equalTo(false))
            .body("data.metadata.cpe", equalTo("cpe:/a:redhat:openshift_gitops:1.19::el8"))
            .body("data.submittedCount", equalTo(GITOPS_119_EXPECTED_SUBMITTED_COUNT))
            .body("data.excludedComponents", hasSize(GITOPS_119_EXPECTED_EXCLUDED_COMPONENT_COUNT))
            .body("data.excludedComponents[0].name", equalTo("dex-1-19"))
            .body("data.excludedComponents[0].exclusionType", equalTo("dependency_not_present"))
            .body("data.excludedComponents[0].error", nullValue());
            

        RestAssured.given()
            .queryParam("productId", productId)
            .queryParam("pageSize", 1)
            .when()
            .get("/api/v1/reports")
            .then()
            .statusCode(200)
            .header("X-Total-Elements", String.valueOf(GITOPS_119_EXPECTED_REPORT_COUNT));

        RestAssured.given()
            .queryParam("productId", productId)
            .queryParam("pageSize", 100)
            .when()
            .get("/api/v1/reports")
            .then()
            .statusCode(200)
            .body("size()", equalTo(GITOPS_119_EXPECTED_REPORT_COUNT))
            .body("componentDependencyTriageFailed", everyItem(equalTo(false)));
    }

    @Test
    void testUpload_SpdxWithUnsupportedComponent_RecordsExcludedComponents() {
        File sbomFile = new File(SPDX_WITH_UNSUPPORTED);

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

        Assertions.assertNotNull(productId, "Product ID should not be null");
        RestApiTestFixture.awaitSpdxProductProcessingComplete(productId);

        RestAssured.given()
            .when()
            .get("/api/v1/products/" + productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.submittedCount", equalTo(2))
            .body("data.excludedComponents", notNullValue())
            .body("data.excludedComponents", hasSize(2))
            .body(
                "data.excludedComponents.findAll { it.name == 'maven-lib' }.exclusionType[0]",
                equalTo("error"))
            .body(
                "data.excludedComponents.findAll { it.name == 'maven-lib' }.error[0]",
                containsString(
                    "Expects a container image purl with format pkg:oci/name@sha256:hash?repository_url=...&tag=..."))
            .body(
                "data.excludedComponents.findAll { it.name == 'dex-rhel' }.exclusionType[0]",
                equalTo("dependency_not_present"))
            .body(
                "data.excludedComponents.findAll { it.name == 'dex-rhel' }.error[0]",
                nullValue());
    }

    @Test
    void testUpload_InvalidMissingSpdxVersion_Returns400() {
        File sbomFile = new File(INVALID_SPDX_DIR, "spdx-missing-version.json");
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.file", equalTo("Document is not a valid SPDX SBOM: missing spdxVersion field."));
    }

    @Test
    void testUpload_InvalidSpdxVersionNotSupported_Returns400() {
        File sbomFile = new File(INVALID_SPDX_DIR, "spdx-wrong-version.json");
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.file", equalTo("Unsupported SPDX version: SPDX-2.2. Only " + SpdxParsingService.SPDX_VERSION_2_3 + " is supported."));
    }

    @Test
    void testUpload_InvalidNoDescribeby_Returns400() {
        File sbomFile = new File(INVALID_SPDX_DIR, "spdx-no-describeby.json");
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

    @Test
    void testUpload_InvalidCveIdEmpty_Returns400() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", "")
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.cveId", equalTo("CVE ID is required"));
    }

    @Test
    void testUpload_InvalidCveIdFormat_Returns400() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", "INVALID-CVE-FORMAT")
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors.cveId", equalTo("Invalid CVE ID: INVALID-CVE-FORMAT. Must match the official CVE pattern CVE-YYYY-NNNN+"));
    }
}
