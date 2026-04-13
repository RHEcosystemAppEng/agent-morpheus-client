package com.redhat.ecosystemappeng.morpheus.rest;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.eclipse.microprofile.config.ConfigProvider;
import org.junit.jupiter.api.Assertions;

import io.restassured.RestAssured;

/**
 * Shared helpers for {@link io.quarkus.test.junit.QuarkusTest} REST tests.
 * <p>
 * Optional remote base URL for RestAssured: Quarkus config key
 * {@value #CONFIG_KEY_EXTERNAL_BASE_URL} (e.g. set in {@code src/test/resources/application.properties}
 * as {@code %test.morpheus.rest-test.external-base-url} or on the Maven command line as
 * {@code -Dmorpheus.rest-test.external-base-url=http://localhost:8080}). When unset or blank,
 * {@link #configureRestAssuredIfExternal()} does nothing so Quarkus keeps the default in-process test URL.
 */
public final class RestApiTestFixture {

    /** Quarkus / MicroProfile config key for RestAssured base URI during REST tests. */
    public static final String CONFIG_KEY_EXTERNAL_BASE_URL = "morpheus.rest-test.external-base-url";

    private RestApiTestFixture() {
    }

    /**
     * Non-empty external base URL (scheme + host, optional port), or empty when tests should use
     * Quarkus-managed RestAssured defaults.
     */
    public static Optional<String> externalBaseUrl() {
        Optional<String> raw = ConfigProvider.getConfig().getOptionalValue(CONFIG_KEY_EXTERNAL_BASE_URL, String.class);
        if (raw.isEmpty()) {
            return Optional.empty();
        }
        String t = raw.get().trim();
        if (t.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(stripTrailingSlash(t));
    }

    /**
     * When a remote base URL is configured, point RestAssured at it; otherwise leave Quarkus defaults.
     */
    public static void configureRestAssuredIfExternal() {
        externalBaseUrl().ifPresent(url -> RestAssured.baseURI = url);
    }

    /**
     * SPDX upload returns 202 while components are processed asynchronously. Call this after a
     * successful upload (before assertions that assume a settled product) so tests do not exit
     * while background work is still running.
     * <p>
     * Waits until {@code reports_for_product + submission_failures == submittedCount} on the product.
     */
    public static void awaitSpdxProductProcessingComplete(String productId) {
        long deadline = System.currentTimeMillis() + Duration.ofMinutes(2).toMillis();
        while (System.currentTimeMillis() < deadline) {
            var product = RestAssured.given()
                .when()
                .get("/api/v1/products/" + productId)
                .then()
                .statusCode(200)
                .extract();
            int submittedCount = product.path("data.submittedCount");
            @SuppressWarnings("unchecked")
            List<?> failures = product.path("data.submissionFailures");
            int failureCount = failures == null ? 0 : failures.size();
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
            if (reportTotal + failureCount == submittedCount) {
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

    private static String stripTrailingSlash(String url) {
        if (url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }
}
