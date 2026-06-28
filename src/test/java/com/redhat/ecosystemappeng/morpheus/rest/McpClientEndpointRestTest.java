package com.redhat.ecosystemappeng.morpheus.rest;

import static org.hamcrest.Matchers.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

@QuarkusTest
public class McpClientEndpointRestTest {

    private final List<String> createdClientIds = new ArrayList<>();

    @BeforeEach
    void restAssuredBase() {
        RestApiTestFixture.configureRestAssuredIfExternal();
    }

    @AfterEach
    void cleanupClients() {
        for (String clientId : createdClientIds) {
            try {
                RestAssured.given()
                    .when()
                    .delete("/api/v1/mcp-clients/" + clientId);
            } catch (Exception ignored) {
            }
        }
        createdClientIds.clear();
    }

    private Map<String, Object> buildRegistration(String clientId, String clientName) {
        return Map.of(
            "clientId", clientId,
            "clientName", clientName,
            "redirectUris", List.of("http://localhost:3000/callback"),
            "grantTypes", List.of("authorization_code"),
            "registeredAt", Instant.now().toString(),
            "clientData", Map.of("scope", "openid", "token_endpoint_auth_method", "client_secret_post")
        );
    }

    @Test
    void testRegisterAndGetClient() {
        String clientId = "test-" + UUID.randomUUID();
        createdClientIds.add(clientId);
        Map<String, Object> registration = buildRegistration(clientId, "Test Client");

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(201)
            .contentType(ContentType.JSON)
            .body("clientId", equalTo(clientId))
            .body("clientName", equalTo("Test Client"))
            .body("redirectUris", hasItem("http://localhost:3000/callback"))
            .body("grantTypes", hasItem("authorization_code"));

        RestAssured.given()
            .when()
            .get("/api/v1/mcp-clients/" + clientId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("clientId", equalTo(clientId))
            .body("clientName", equalTo("Test Client"))
            .body("clientData.scope", equalTo("openid"));
    }

    @Test
    void testRegisterDuplicateReturns409() {
        String clientId = "dup-" + UUID.randomUUID();
        createdClientIds.add(clientId);
        Map<String, Object> registration = buildRegistration(clientId, "Dup Client");

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(201);

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(409)
            .body("error", containsString("already exists"));
    }

    @Test
    void testRegisterWithMissingClientIdReturns400() {
        Map<String, Object> registration = Map.of(
            "clientName", "Bad Client",
            "redirectUris", List.of(),
            "grantTypes", List.of(),
            "registeredAt", Instant.now().toString(),
            "clientData", Map.of()
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testGetNonExistentClientReturns404() {
        RestAssured.given()
            .when()
            .get("/api/v1/mcp-clients/nonexistent-client-" + UUID.randomUUID())
            .then()
            .statusCode(404)
            .body("error", containsString("not found"));
    }

    @Test
    void testDeleteNonExistentClientReturns404() {
        RestAssured.given()
            .when()
            .delete("/api/v1/mcp-clients/nonexistent-client-" + UUID.randomUUID())
            .then()
            .statusCode(404)
            .body("error", containsString("not found"));
    }

    @Test
    void testListClients() {
        String clientId1 = "list-a-" + UUID.randomUUID();
        String clientId2 = "list-b-" + UUID.randomUUID();
        createdClientIds.add(clientId1);
        createdClientIds.add(clientId2);

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(buildRegistration(clientId1, "List Client A"))
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(201);

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(buildRegistration(clientId2, "List Client B"))
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(201);

        RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 100)
            .get("/api/v1/mcp-clients")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Elements", notNullValue())
            .body("clientId", hasItems(clientId1, clientId2));
    }

    @Test
    void testListClientsPagination() {
        String clientId1 = "page-a-" + UUID.randomUUID();
        String clientId2 = "page-b-" + UUID.randomUUID();
        createdClientIds.add(clientId1);
        createdClientIds.add(clientId2);

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(buildRegistration(clientId1, "Page Client A"))
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(201);

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(buildRegistration(clientId2, "Page Client B"))
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(201);

        RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 1)
            .get("/api/v1/mcp-clients")
            .then()
            .statusCode(200)
            .header("X-Total-Elements", notNullValue())
            .header("X-Total-Pages", notNullValue())
            .body("size()", equalTo(1));
    }

    @Test
    void testRegisterWithBlankClientIdReturns400() {
        Map<String, Object> registration = Map.of(
            "clientId", "   ",
            "clientName", "Blank Id Client",
            "redirectUris", List.of(),
            "grantTypes", List.of(),
            "registeredAt", Instant.now().toString(),
            "clientData", Map.of()
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testRegisterWithMissingClientNameReturns400() {
        Map<String, Object> registration = Map.of(
            "clientId", "no-name-" + UUID.randomUUID(),
            "redirectUris", List.of(),
            "grantTypes", List.of(),
            "registeredAt", Instant.now().toString(),
            "clientData", Map.of()
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testRegisterWithMissingRegisteredAtReturns400() {
        Map<String, Object> registration = Map.of(
            "clientId", "no-date-" + UUID.randomUUID(),
            "clientName", "No Date Client",
            "redirectUris", List.of(),
            "grantTypes", List.of(),
            "clientData", Map.of()
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testRegisterWithMissingClientDataReturns400() {
        Map<String, Object> registration = Map.of(
            "clientId", "no-data-" + UUID.randomUUID(),
            "clientName", "No Data Client",
            "redirectUris", List.of(),
            "grantTypes", List.of(),
            "registeredAt", Instant.now().toString()
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testRegisterWithMalformedRegisteredAtReturns400() {
        Map<String, Object> registration = Map.of(
            "clientId", "bad-date-" + UUID.randomUUID(),
            "clientName", "Bad Date Client",
            "redirectUris", List.of(),
            "grantTypes", List.of(),
            "registeredAt", "not-a-date",
            "clientData", Map.of()
        );

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(registration)
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testListWithNegativePageReturns400() {
        RestAssured.given()
            .when()
            .queryParam("page", -1)
            .queryParam("pageSize", 10)
            .get("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testListWithZeroPageSizeReturns400() {
        RestAssured.given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 0)
            .get("/api/v1/mcp-clients")
            .then()
            .statusCode(400);
    }

    @Test
    void testDeleteClient() {
        String clientId = "del-" + UUID.randomUUID();
        createdClientIds.add(clientId);

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(buildRegistration(clientId, "Delete Me"))
            .when()
            .post("/api/v1/mcp-clients")
            .then()
            .statusCode(201);

        RestAssured.given()
            .when()
            .delete("/api/v1/mcp-clients/" + clientId)
            .then()
            .statusCode(204);

        RestAssured.given()
            .when()
            .get("/api/v1/mcp-clients/" + clientId)
            .then()
            .statusCode(404);
    }
}
