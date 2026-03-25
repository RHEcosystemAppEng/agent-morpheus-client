package com.redhat.ecosystemappeng.morpheus.client;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.exception.ExhortCveGateException;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

/**
 * Trustify Dependency Analytics (Exhort) REST client API v5.
 * See <a href="https://github.com/guacsec/trustify-da-api-spec">trustify-da-api-spec</a>.
 */
@Path("/api/v5")
@RegisterRestClient(configKey = "exhort")
public interface ExhortService {

    Logger LOGGER = Logger.getLogger(ExhortService.class);

    String CYCLONEDX_JSON = "application/vnd.cyclonedx+json";

    /**
     * Raw POST /analysis call. Prefer {@link #requestAnalysis(String, String)} for domain errors.
     *
     * @param cvesFilter optional comma-separated CVE ids (v5 {@code cves} query); omit by passing {@code null} or blank
     */
    @POST
    @Path("/analysis")
    @Consumes(CYCLONEDX_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    String analysis(@QueryParam("cves") String cvesFilter, String cyclonedxJson);

    /**
     * Runs dependency analysis and returns JSON, or throws {@link ExhortCveGateException} if the call fails,
     * the HTTP status is not successful, or the body is empty. Response-body triage gates (every provider's
     * {@code status.ok} / {@code status.warnings} (after Syft main-module omission using the same CycloneDX), then
     * issue trees) run inside
     * {@link com.redhat.ecosystemappeng.morpheus.service.ExhortResponseParser#cveFoundInAnalysisResponse(String, String, JsonNode)}
     * (or the {@code String} CycloneDX overload).
     *
     * @param cvesFilter CVE id(s) for Exhort's {@code cves} query parameter (comma-separated per OpenAPI v5); if null or blank, the query parameter is omitted
     */
    default String requestAnalysis(String cyclonedxJson, String cvesFilter) {
        String cvesParam = (cvesFilter == null || cvesFilter.isBlank()) ? null : cvesFilter.trim();
        LOGGER.infof(
                "Calling Exhort API: POST /api/v5/analysis with CycloneDX body (%d bytes), cves=%s",
                cyclonedxJson != null ? cyclonedxJson.length() : 0,
                cvesParam != null ? cvesParam : "(omitted)");
        try {
            String response = analysis(cvesParam, cyclonedxJson);
            if (response == null || response.isBlank()) {
                throw new ExhortCveGateException("Exhort analysis response is empty");
            }
            return response;
        } catch (Exception e) {
            if (e instanceof ExhortCveGateException exhortCveGateException) {
                throw exhortCveGateException;
            }
            LOGGER.errorf("Exhort analysis request failed: %s", e.getMessage());
            throw new ExhortCveGateException("Exhort analysis request failed", e);
        }
    }
}
