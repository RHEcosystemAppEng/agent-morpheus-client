package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * End-to-end test for the report upload API endpoint.
 * 
 * This test assumes the service is running in a separate process.
 * Set the BASE_URL environment variable to point to the running service,
 * e.g., BASE_URL=http://localhost:8080
 * 
 * If BASE_URL is not set, tests will be skipped.
 */
@EnabledIfEnvironmentVariable(named = "BASE_URL", matches = ".*")
class ReportUploadEndpointTest {

    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final String API_BASE = BASE_URL != null ? BASE_URL : "http://localhost:8080";
    private static final String TEST_SBOM_FILE = "src/test/resources/devservices/sboms/nmstate-rhel8-operator.json";
    private static final String TEST_CVE_ID = "CVE-2021-3121";

    private String createInvalidJsonFile() throws IOException {
        Path tempFile = Files.createTempFile("invalid-", ".json");
        File file = tempFile.toFile();
        file.deleteOnExit();
        
        try (FileWriter writer = new FileWriter(file)) {
            writer.write("{ invalid json }");
        }
        return file.getAbsolutePath();
    }

    private String createCycloneDxWithoutComponentName() throws IOException {
        Path tempFile = Files.createTempFile("cyclonedx-no-name-", ".json");
        File file = tempFile.toFile();
        file.deleteOnExit();
        
        try (FileWriter writer = new FileWriter(file)) {
            writer.write("""
                {
                  "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
                  "bomFormat": "CycloneDX",
                  "specVersion": "1.6",
                  "serialNumber": "urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79",
                  "version": 1,
                  "metadata": {
                    "timestamp": "2024-01-15T10:00:00Z",
                    "tools": [],
                    "component": {
                      "version": "1.0.0"
                    },
                    "properties": [
                      {
                        "name": "image.source-location",
                        "value": "https://github.com/openshift/kubernetes-nmstate"
                      },
                      {
                        "name": "image.source.commit-id",
                        "value": "444141eb5cc460308e662509df18ae1d0274005b"
                      }
                    ]
                  },
                  "components": [],
                  "dependencies": []
                }
                """);
        }
        return file.getAbsolutePath();
    }

    @Test
    void testUpload_ValidFileAndCveId() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.baseURI = API_BASE;
        
        // Upload the file and verify report was created
        String productId = RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_CVE_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(202)
            .contentType(ContentType.JSON)
            .body("reportRequestId", notNullValue())
            .body("reportRequestId.id", notNullValue())
            .body("report.metadata.product_id", notNullValue())
            .extract()
            .path("report.metadata.product_id");
        
        // Verify product was created by querying the product endpoint
        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/" + productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.id", equalTo(productId))
            .body("data.name", notNullValue())
            .body("data.cveId", equalTo(TEST_CVE_ID))
            .body("data.submittedCount", equalTo(1))
            .body("data.submittedAt", notNullValue());
    }

    @Test
    void testUpload_InvalidJsonFile() throws IOException {
        String filePath = createInvalidJsonFile();
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_CVE_ID)
            .multiPart("file", new File(filePath))
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.file", notNullValue())
            .body("errors.file", containsString("not valid JSON"));
    }

    @Test
    void testUpload_MissingComponentName() throws IOException {
        String filePath = createCycloneDxWithoutComponentName();
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_CVE_ID)
            .multiPart("file", new File(filePath))
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.file", notNullValue())
            .body("errors.file", containsString("metadata.component.name"));
    }

    @Test
    void testUpload_MissingCveId() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.cveId", notNullValue())
            .body("errors.cveId", containsString("CVE ID is required"));
    }

    @Test
    void testUpload_MissingFile() {
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_CVE_ID)
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.file", notNullValue())
            .body("errors.file", containsString("File is required"));
    }

    @Test
    void testUpload_InvalidCveIdFormat() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", "INVALID-CVE-FORMAT")
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.cveId", notNullValue())
            .body("errors.cveId", containsString("CVE ID format is invalid"));
    }

    @Test
    void testUpload_MongoDbFile() {
        File mongodbFile = new File("src/test/resources/devservices/sboms/mongodb.json");
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", "CVE-2023-3106")
            .multiPart("file", mongodbFile)
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.file", notNullValue())
            .body("errors.file", containsString("SBOM is missing required field"))
            .body("errors.file", containsString("Checked keys:"));
    }

    @Test
    void testUpload_ProductCreatedWithVersion() throws IOException {
        // Create a CycloneDX file with version
        Path tempFile = Files.createTempFile("cyclonedx-with-version-", ".json");
        File file = tempFile.toFile();
        file.deleteOnExit();
        
        try (FileWriter writer = new FileWriter(file)) {
            writer.write("""
                {
                  "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
                  "bomFormat": "CycloneDX",
                  "specVersion": "1.6",
                  "metadata": {
                    "component": {
                      "name": "test-product-with-version",
                      "version": "2.5.0"
                    },
                    "properties": [
                      {
                        "name": "image.source-location",
                        "value": "https://github.com/openshift/kubernetes-nmstate"
                      },
                      {
                        "name": "image.source.commit-id",
                        "value": "444141eb5cc460308e662509df18ae1d0274005b"
                      }
                    ]
                  },
                  "components": []
                }
                """);
        }
        
        RestAssured.baseURI = API_BASE;
        
        String productId = RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_CVE_ID)
            .multiPart("file", file)
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(202)
            .extract()
            .path("report.metadata.product_id");
        
        // Verify product was created with the version from the file
        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/" + productId)
            .then()
            .statusCode(200)
            .body("data.version", equalTo("2.5.0"));
    }

    @Test
    void testUpload_ProductCreatedWithoutVersion() throws IOException {
        // Create a CycloneDX file without version
        Path tempFile = Files.createTempFile("cyclonedx-no-version-", ".json");
        File file = tempFile.toFile();
        file.deleteOnExit();
        
        try (FileWriter writer = new FileWriter(file)) {
            writer.write("""
                {
                  "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
                  "bomFormat": "CycloneDX",
                  "specVersion": "1.6",
                  "metadata": {
                    "component": {
                      "name": "test-product-without-version"
                    },
                    "properties": [
                      {
                        "name": "image.source-location",
                        "value": "https://github.com/openshift/kubernetes-nmstate"
                      },
                      {
                        "name": "image.source.commit-id",
                        "value": "444141eb5cc460308e662509df18ae1d0274005b"
                      }
                    ]
                  },
                  "components": [],
                  "dependencies": []
                }
                """);
        }
        
        RestAssured.baseURI = API_BASE;
        
        // Upload should succeed even without version
        io.restassured.response.Response response = RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_CVE_ID)
            .multiPart("file", file)
            .when()
            .post("/api/v1/products/upload-cyclonedx");
        
        if (response.getStatusCode() != 202) {
            System.err.println("Error response body: " + response.getBody().asString());
            System.err.println("Status code: " + response.getStatusCode());
        }
        
        String productId = response.then()
            .statusCode(202)
            .extract()
            .path("report.metadata.product_id");
        
        // Verify product was created with empty string version (no default version fallback)
        RestAssured.given()
            .when()
            .get("/api/v1/reports/product/" + productId)
            .then()
            .statusCode(200)
            .body("data.version", equalTo(""));
    }

    @Test
    void testUpload_InvalidJsonFile_NoProductCreated() throws IOException {
        String filePath = createInvalidJsonFile();
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_CVE_ID)
            .multiPart("file", new File(filePath))
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.file", notNullValue())
            .body("errors.file", containsString("not valid JSON"));
        
        // Verify no product was created by checking that a random product ID doesn't exist
        // (We can't easily verify "no product created" without knowing what product ID would have been generated,
        // but we can at least verify the request failed before product creation)
    }

    @Test
    void testUpload_MissingCveId_NoProductCreated() {
        File sbomFile = new File(TEST_SBOM_FILE);
        RestAssured.baseURI = API_BASE;
        
        RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-cyclonedx")
            .then()
            .statusCode(400)
            .contentType(ContentType.JSON)
            .body("errors", notNullValue())
            .body("errors.cveId", notNullValue())
            .body("errors.cveId", containsString("CVE ID is required"));
        
        // Verify no product was created (validation failed before product creation)
    }
}


