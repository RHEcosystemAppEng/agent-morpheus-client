/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;

import io.smallrye.context.api.ManagedExecutorConfig;

import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.SyftExecutionException;
import com.redhat.ecosystemappeng.morpheus.model.FailedComponent;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService;
import com.redhat.ecosystemappeng.morpheus.repository.ReportRepositoryService;
import com.redhat.ecosystemappeng.morpheus.service.SpdxParsingService.ComponentInfo;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ComponentProcessingService {

    private static final Logger LOGGER = Logger.getLogger(ComponentProcessingService.class);

    /** Max components processed concurrently; each batch waits for completion before starting the next. */
    private static final int BATCH_SIZE = 20;

    private ReportService reportService;
    private GenerateSbomService generateSbomService;
    private ProductRepositoryService productRepositoryService;
    private ReportRepositoryService reportRepositoryService;
    private CredentialProcessingService credentialProcessingService;

    @Inject
    @ManagedExecutorConfig(maxAsync = 20, maxQueued = 2)
    ManagedExecutor executorService;

    @Inject
    public void setReportService(ReportService reportService) {
        this.reportService = reportService;
    }

    @Inject
    public void setGenerateSbomService(GenerateSbomService generateSbomService) {
        this.generateSbomService = generateSbomService;
    }

    @Inject
    public void setProductRepositoryService(ProductRepositoryService productRepositoryService) {
        this.productRepositoryService = productRepositoryService;
    }

    @Inject
    public void setReportRepositoryService(ReportRepositoryService reportRepositoryService) {
        this.reportRepositoryService = reportRepositoryService;
    }

    @Inject
    public void setCredentialProcessingService(CredentialProcessingService credentialProcessingService) {
        this.credentialProcessingService = credentialProcessingService;
    }

    /**
     * Process a single component through the pipeline:
     * 1. Generate report (SBOM generation and report creation)
     * 2. Save report and submit via reportService (queue for analysis)
     * 
     * Failures before report creation are saved to product.submissionFailures.
     * Failures after report creation (save or submit) are saved to the report via updateWithError.
     * 
     * @param component The SPDX component to process
     * @param productId The product ID this component belongs to
     * @param metadata Additional metadata to include in the report
     * @param vulnerabilityId Optional vulnerability ID to include in the report
     * @param credentialId Optional credential ID to inject into the report
     */
    private void processComponent(ComponentInfo component, String productId, Map<String, String> metadata, String vulnerabilityId, String credentialId) {
        ReportData reportData = null;
        
        // Try to generate report - all failures here go to submissionFailures
        try {
            reportData = generateReport(component, productId, vulnerabilityId);
            String reportId = reportData.reportRequestId().reportId();

            // Inject credentialId into report if provided
            if (Objects.nonNull(credentialId) && Objects.nonNull(reportData.report())) {
                credentialProcessingService.injectCredentialId(reportData.report(), credentialId);
            }
            LOGGER.infof("Created report %s for component: %s", reportId, component.name());
        } catch (SyftExecutionException e) {
            // Pre-save failure: Syft-specific error - save to submissionFailures
            // Expected exception - message is ready to use
            String image = e.getImage();
            LOGGER.errorf("Syft failed for component %s (image: %s): %s", component.name(), image, e.getMessage());
            productRepositoryService.addSubmissionFailure(productId, new FailedComponent(component.name(), component.version(), component.image(), e.getMessage()));
            return; // Exit early - no report to save
        } catch (SbomValidationException e) {
            // Pre-save failure: Validation error - save to submissionFailures
            // Expected exception - message is ready to use
            LOGGER.errorf("Sbom validation error for component %s: %s", component.name(), e.getMessage());
            productRepositoryService.addSubmissionFailure(productId, new FailedComponent(component.name(), component.version(), component.image(), "Syft generated an invalid SBOM: " + e.getMessage()));
            return; // Exit early - no report to save
        } catch (Exception e) {
            // Pre-save failure: Any other error during report generation - save to submissionFailures            
            String errorMessage = getErrorMessage(e);
            LOGGER.errorf(e,"Unexpected error during report generation for component %s: %s", component.name(), errorMessage);
            productRepositoryService.addSubmissionFailure(productId, new FailedComponent(component.name(), component.version(), component.image(), "Unexpected error during report generation"));
            return; // Exit early - no report to save
        }        

        // Try to save report and submit via reportService (queue for analysis)
        ReportData savedReportData = null;
        try {
            savedReportData = reportService.saveReport(reportData);
            String reportId = savedReportData.reportRequestId().reportId();
            LOGGER.infof("Saved report %s to repository for component: %s", reportId, component.name());
            reportService.submit(savedReportData.reportRequestId().id(), savedReportData.report());
            LOGGER.infof("Submitted report %s for analysis (component: %s)", reportId, component.name());
        } catch (Exception e) {
            // Post-save failure: error during save or submit - update report or submissionFailures
            if (savedReportData != null) {
                String reportId = savedReportData.reportRequestId().id();
                String errorMessage = getErrorMessage(e);
                LOGGER.errorf("Failed to submit report %s for component %s: %s", reportId, component.name(), errorMessage);
                String formattedErrorMessage = formatErrorMessage(e,"Unexpected error while submitting report");
                reportRepositoryService.updateWithError(reportId, "submit-error", formattedErrorMessage);
            } else {
                LOGGER.errorf("Failed to save report for component %s: %s", component.name(), getErrorMessage(e));
                productRepositoryService.addSubmissionFailure(productId, new FailedComponent(component.name(), component.version(), component.image(), formatErrorMessage(e,"Unexpected error while saving report")));
            }
        }
    }

    private static String formatErrorMessage(Exception e, String prefixMessage) {
//        In case of Queue Exceeded exception, needs to hide the implementation details of queue and
//        just return a non disclosing message that the component' request exceeded the maximum number of allowed simultaneous requests.
        if(e instanceof RequestQueueExceededException) {
            return String.format("%s: Too Many Parallel Requests", prefixMessage);
        }
//        Otherwise, return just a generic error message, could be looked up in logs what is the specific reason for failure/error.
        return prefixMessage;
    }

    /**
     * Generate a report for a component by generating the SBOM and creating report data.
     * This handles the pre-save phase of component processing.
     * 
     * @param component The component to generate a report for
     * @param productId The product ID this component belongs to
     * @param vulnerabilityId Optional vulnerability ID to include in the report
     * @return ReportData containing the created report
     * @throws SyftExecutionException if SBOM generation fails
     * @throws SbomValidationException if SBOM validation fails
     * @throws Exception for other pre-save failures
     */
    private ReportData generateReport(ComponentInfo component, String productId, String vulnerabilityId) 
            throws SyftExecutionException, SbomValidationException, Exception {
        String image = component.image();
        
        // Generate CycloneDX SBOM using GenerateSbomService
        ParsedCycloneDx cycloneDxSbom = generateSbomService.generate(image);
        LOGGER.infof("Generated CycloneDX SBOM for component: %s", component.name());

        // Create report data
        ReportData reportData = reportService.createCycloneDxReportData(cycloneDxSbom, productId, vulnerabilityId, true);
        LOGGER.infof("Created report data for component: %s", component.name());
        
        return reportData;
    }


    /**
     * Get error message from an exception.
     * For expected exceptions (SyftExecutionException, SbomValidationException),
     * the message is already available via getMessage() and doesn't need processing.
     * For unexpected exceptions, this method extracts a meaningful message.
     *
     * @param e The exception to extract message from
     * @return A meaningful error message, never null
     */
    private String getErrorMessage(Exception e) {
        if (e.getMessage() != null && !e.getMessage().trim().isEmpty()) {
            return e.getMessage();
        }
        // If no message, use the exception class name
        return e.getClass().getSimpleName() + " occurred";
    }

    /**
     * Process multiple components in parallel in batches of {@value #BATCH_SIZE}.
     * Each batch of up to 20 is submitted to the executor; the caller waits for the batch
     * to complete before submitting the next, so at most 20 run at a time and the queue stays small.
     *
     * @param components List of components to process
     * @param productId The product ID
     * @param metadata Additional metadata
     * @param vulnerabilityId Optional vulnerability ID to include in all component reports
     * @param credentialId Optional credential ID to inject into all component reports
     */
    public void processComponents(List<ComponentInfo> components, String productId,
                                 Map<String, String> metadata, String vulnerabilityId, String credentialId) {
        if (components.isEmpty()) {
            throw new IllegalArgumentException("No components to process");
        }

        LOGGER.infof("Processing %d components in batches of %d", components.size(), BATCH_SIZE);

        for (int i = 0; i < components.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, components.size());
            final List<ComponentInfo> batch = new ArrayList<>(components.subList(i, end));
            executorService.runAsync(() -> {
                for (ComponentInfo component : batch) {
                    try {
                        this.processComponent(component, productId, metadata, vulnerabilityId, credentialId);
                    } catch (Exception e) {
                        String errorMessage = getErrorMessage(e);
                        LOGGER.errorf("Unexpected error processing component %s: %s", component.name(), errorMessage);
                    }
                }
            });
        }
    }
}
