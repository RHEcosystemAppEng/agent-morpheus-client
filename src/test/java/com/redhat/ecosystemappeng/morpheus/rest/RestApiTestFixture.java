package com.redhat.ecosystemappeng.morpheus.rest;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Assertions;

import io.restassured.RestAssured;

/**
 * Shared helpers for {@link io.quarkus.test.junit.QuarkusTest} REST tests.
 */
public final class RestApiTestFixture {

    private RestApiTestFixture() {
    }

    /**
     * SPDX upload returns 202 while components are processed asynchronously. Call this after a
     * successful upload (before assertions that assume a settled product) so tests do not exit
     * while background work is still running.
     * <p>
     * Waits until {@code reports_for_product + excluded_components == submittedCount} on the product.
     */
    public static void awaitSpdxProductProcessingComplete(String productId) {
        // SPDX + Syft + Exhort for many images can exceed a few minutes under load or slow registry.
        long deadline = System.currentTimeMillis() + Duration.ofMinutes(5).toMillis();
        while (System.currentTimeMillis() < deadline) {
            var product = RestAssured.given()
                .when()
                .get("/api/v1/products/" + productId)
                .then()
                .statusCode(200)
                .extract();
            int submittedCount = product.path("data.submittedCount");
            @SuppressWarnings("unchecked")
            List<?> excluded = product.path("data.excludedComponents");
            int excludedCount = excluded == null ? 0 : excluded.size();
            String totalElements = RestAssured.given()
                .queryParam("productId", productId)
                .queryParam("pageSize", 1)
                .when()
                .get("/api/v1/reports")
                .then()
                .statusCode(200)
                .extract()
                .header("X-Total-Elements");
            long reportTotal = totalElements == null ? 0L : Long.parseLong(totalElements);
            if (reportTotal + excludedCount == submittedCount) {
                return;
            }
            try {
                Thread.sleep(300L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                Assertions.fail("Interrupted while waiting for SPDX processing");
            }
        }
        Assertions.fail("Timeout waiting for SPDX processing to finish for product " + productId);
    }
}
