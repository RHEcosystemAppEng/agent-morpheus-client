package com.redhat.ecosystemappeng.morpheus.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.client.ComponentSyncerService;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.service.SpdxParsingService.ComponentInfo;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class ComponentProcessingService {

    private static final Logger LOGGER = Logger.getLogger(ComponentProcessingService.class);

    @Inject
    ObjectMapper objectMapper;

    @Inject
    ReportService reportService;

    @Inject
    ReportRepositoryService reportRepositoryService;

    @Inject
    GenerateSbomService generateSbomService;

    @RestClient
    ComponentSyncerService componentSyncerService;

    // Fixed thread pool for component processing (max 10 concurrent)
    private final ExecutorService executorService = Executors.newFixedThreadPool(20);

    /**
     * Process a single component through the pipeline:
     * 1. Create pending report with vulnerability ID
     * 2. Execute syft to generate CycloneDX SBOM
     * 3. (Future) Call clair API for vulnerability scanning
     * 4. Call component syncer API
     * 5. Update report with SBOM and add to queue
     * 
     * @param component The SPDX component to process
     * @param productId The product ID this component belongs to
     * @param metadata Additional metadata to include in the report
     * @param vulnerabilityId Optional vulnerability ID to include in the report
     */
    public void processComponent(ComponentInfo component, String productId, Map<String, String> metadata, String vulnerabilityId) {
        String reportId = null;
        try {
            // Create pending report first with vulnerability ID
            LOGGER.infof("Creating pending report for component: %s", component.name());
            ReportData reportData = reportService.createPendingReport(component, productId, metadata, vulnerabilityId);
            reportId = reportData.reportRequestId().id();
            LOGGER.infof("Created pending report %s for component: %s", reportId, component.name());
        } catch (Exception e) {
            LOGGER.errorf(e, "Failed to create pending report for component %s: %s", component.name(), e.getMessage());
            // Can't update error without reportId, so just log and return
            return;
        }

        String image = null;
        try {
            // Parse image from component reference (same logic as productScanClient.js)
            image = parseImageFromReference(component);
            if (image == null) {
                throw new IllegalArgumentException("Failed to extract image from component reference: " + component.purl());
            }
            
            // Generate CycloneDX SBOM using GenerateSbomService
            JsonNode cycloneDxSbom = generateSbomService.generate(image);
            LOGGER.infof("Generated CycloneDX SBOM for component: %s", component.name());

            // Call component syncer API
            // callComponentSyncerSync(cycloneDxSbom, component, productId);
            // LOGGER.infof("Called component syncer for component: %s", component.name());

            // Update existing report with SBOM and queue it
            JsonNode updatedReport = reportService.updateReportWithSbom(reportId, cycloneDxSbom, component);
            reportService.submit(reportId, updatedReport);
            LOGGER.infof("Updated and queued report %s for component: %s", reportId, component.name());
        } catch (SyftExecutionException e) {
            // Syft-specific error handling
            String fullErrorMessage = e.getMessage();
            String target = e.getTarget();
            // Log the full error details
            LOGGER.errorf("Syft failed for component %s (image: %s): %s", component.name(), target, fullErrorMessage);
            
            // Update report with general error message (just image, not full details)
            if (reportId != null) {
                String errorType = "syft-execution-failed";
                String reportErrorMessage = target != null 
                    ? String.format("Syft failed for target: %s", target)
                    : "Syft execution failed";
                reportRepositoryService.updateWithError(reportId, errorType, reportErrorMessage);
                LOGGER.infof("Updated report %s with syft error: %s", reportId, reportErrorMessage);
            }
        } catch (Exception e) {
            // Other errors - log with full context but extract meaningful message
            String errorMessage = extractErrorMessage(e);
            LOGGER.errorf("Failed to process component %s: %s", component.name(), errorMessage);
            // Update report with error
            if (reportId != null) {
                String errorType = "component-processing-failed";
                reportRepositoryService.updateWithError(reportId, errorType, errorMessage);
                LOGGER.infof("Updated report %s with error: %s", reportId, errorMessage);
            }
        }
    }

    /**
     * Extract a meaningful error message from an exception.
     * Prefers the exception message, falls back to exception class name if message is null.
     */
    private String extractErrorMessage(Exception e) {
        if (e.getMessage() != null && !e.getMessage().trim().isEmpty()) {
            return e.getMessage();
        }
        // If no message, use the exception class name
        return e.getClass().getSimpleName() + " occurred";
    }

    /**
     * Parse image from component reference using the same logic as productScanClient.js.
     * Extracts repository_url and tag from PURL query parameters and combines them as repository_url:tag.
     * 
     * @param component The component info containing the PURL reference
     * @return The image string in format "repository_url:tag" or null if parsing fails
     */
    private String parseImageFromReference(ComponentInfo component) {
        if (component.purl() == null || !component.purl().startsWith("pkg:oci/")) {
            return null;
        }
        
        // Extract query string from PURL (everything after ?)
        String purl = component.purl();
        int queryIndex = purl.indexOf('?');
        if (queryIndex == -1) {
            return null;
        }
        
        String queryString = purl.substring(queryIndex + 1);
        if (queryString.isEmpty()) {
            return null;
        }
        
        // Parse query parameters
        String repositoryUrl = null;
        String tag = null;
        
        String[] params = queryString.split("&");
        for (String param : params) {
            String[] keyValue = param.split("=", 2);
            if (keyValue.length == 2) {
                String key = keyValue[0];
                String value = keyValue[1];
                // URL decode the value (basic handling)
                value = java.net.URLDecoder.decode(value, java.nio.charset.StandardCharsets.UTF_8);
                
                if ("repository_url".equals(key)) {
                    repositoryUrl = value;
                } else if ("tag".equals(key)) {
                    tag = value;
                }
            }
        }
        
        // Return combined image string if both are present
        if (repositoryUrl != null && tag != null) {
            return repositoryUrl + ":" + tag;
        }
        
        return null;
    }

    /**
     * Call component syncer API with the CycloneDX SBOM (synchronous version).
     * This creates a CloudEvent payload and sends it to the component syncer.
     */
    private void callComponentSyncerSync(JsonNode cycloneDxSbom, ComponentInfo component, String productId) {
        try {
            // Create CloudEvent payload for component syncer
            ObjectNode cloudEvent = objectMapper.createObjectNode();
            cloudEvent.put("specversion", "1.0");
            cloudEvent.put("type", "com.redhat.ecosystemappeng.morpheus.component.sbom");
            cloudEvent.put("source", "agent-morpheus-client");
            cloudEvent.put("id", UUID.randomUUID().toString());
            
            ObjectNode data = objectMapper.createObjectNode();
            data.put("product_id", productId);
            data.put("component_spdx_id", component.spdxId());
            data.put("component_name", component.name());
            data.put("component_version", component.version() != null ? component.version() : "");
            data.put("component_purl", component.purl() != null ? component.purl() : "");
            data.set("sbom", cycloneDxSbom);
            
            cloudEvent.set("data", data);
            
            LOGGER.infof("Calling component syncer API for component: %s", component.name());
            Response response = componentSyncerService.submit(cloudEvent);
            
            int status = response.getStatus();
            if (status >= Response.Status.OK.getStatusCode() && 
                status < Response.Status.MULTIPLE_CHOICES.getStatusCode()) {
                LOGGER.infof("Successfully called component syncer for component: %s", component.name());
            } else {
                String errorBody = response.readEntity(String.class);
                throw new RuntimeException("Component syncer returned status " + status + ": " + errorBody);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call component syncer API for component: " + component.name(), e);
        }
    }

    /**
     * Process multiple components in parallel (fire-and-forget).
     * Concurrency is controlled by the fixed thread pool size (max 10 concurrent).
     * 
     * @param components List of components to process
     * @param productId The product ID
     * @param metadata Additional metadata
     * @param vulnerabilityId Optional vulnerability ID to include in all component reports
     */
    public void processComponents(List<ComponentInfo> components, String productId, 
                                 Map<String, String> metadata, String vulnerabilityId) {
        if (components.isEmpty()) {
            return;
        }

        LOGGER.infof("Processing %d components (fire-and-forget)", components.size());
        
        // Fire off each component processing without waiting
        components.forEach(component -> {
            executorService.submit(() -> {
                try {
                    processComponent(component, productId, metadata, vulnerabilityId);
                } catch (Exception e) {
                    String errorMessage = extractErrorMessage(e);
                    LOGGER.errorf("Unexpected error processing component %s: %s", component.name(), errorMessage);
                }
            });
        });
    }
}
