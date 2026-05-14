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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.client.ExhortService;
import com.redhat.ecosystemappeng.morpheus.exception.ExhortCveGateException;
import io.smallrye.context.api.ManagedExecutorConfig;
import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.SyftExecutionException;
import com.redhat.ecosystemappeng.morpheus.model.ExcludedComponent;
import com.redhat.ecosystemappeng.morpheus.model.ExclusionType;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService;
import com.redhat.ecosystemappeng.morpheus.repository.ReportRepositoryService;
import com.redhat.ecosystemappeng.morpheus.service.SpdxParsingService.ComponentInfo;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ComponentProcessingService {

    private static final Logger LOGGER = Logger.getLogger(ComponentProcessingService.class);

    public static final String SYFT_INVALID_SBOM_PREFIX = "Syft generated an invalid SBOM: ";

    /** Max components processed concurrently; each batch waits for completion before starting the next. */
    private static final int BATCH_SIZE = 20;

    private ReportService reportService;
    private GenerateSbomService generateSbomService;
    private ProductRepositoryService productRepositoryService;
    private ReportRepositoryService reportRepositoryService;
    private CredentialProcessingService credentialProcessingService;
    private ExhortService exhortService;
    private ExhortResponseParser exhortResponseParser;
    private ExhortHealthProbe exhortHealthProbe;
    private SyftExhortDebugDumpService syftExhortDebugDumpService;
    private ObjectMapper objectMapper;

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

    @Inject
    public void setExhortService(@RestClient ExhortService exhortService) {
        this.exhortService = exhortService;
    }

    @Inject
    public void setExhortResponseParser(ExhortResponseParser exhortResponseParser) {
        this.exhortResponseParser = exhortResponseParser;
    }

    @Inject
    public void setExhortHealthProbe(ExhortHealthProbe exhortHealthProbe) {
        this.exhortHealthProbe = exhortHealthProbe;
    }

    @Inject
    public void setSyftExhortDebugDumpService(SyftExhortDebugDumpService syftExhortDebugDumpService) {
        this.syftExhortDebugDumpService = syftExhortDebugDumpService;
    }

    @Inject
    public void setObjectMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Process a single component through the pipeline:
     * 1. Generate report (SBOM generation and report creation)
     * 2. Save report and submit via reportService (queue for analysis)
     * 
     * Failures before report creation are saved to product.excludedComponents, except when dependency
     * analytics (Exhort) fails after a healthy whole-product probe: that path proceeds to report creation
     * with {@code componentDependencyTriageFailed} set to {@code true} on the report. When the whole-product
     * Exhort probe was unhealthy, dependency triage is skipped and {@code componentDependencyTriageFailed}
     * remains {@code false} (product {@code dependencyTriageUnavailable} carries that case).
     * Failures after report creation (save or submit) are saved to the report via updateWithError.
     * 
     * @param component The SPDX component to process
     * @param productId The product ID this component belongs to
     * @param metadata Additional metadata to include in the report
     * @param vulnerabilityId Optional vulnerability ID to include in the report
     * @param credentialId Optional credential ID to inject into the report
     */
    private void processComponent(
            ComponentInfo component,
            String productId,
            Map<String, String> metadata,
            String vulnerabilityId,
            String credentialId,
            boolean skipExhortDependencyTriage) {
        ReportData reportData;
        String cycloneDxJson = null;
        String exhortAnalysisForDump = null;
        try {
            String image = component.image();
            LOGGER.infof("Processing component: %s", component.name());
            ParsedCycloneDx cycloneDxSbom = generateSbomService.generate(image);
            LOGGER.infof("Generated CycloneDX SBOM for component: %s", component.name());
            if (!skipExhortDependencyTriage || syftExhortDebugDumpService.isEnabled()) {
                try {
                    cycloneDxJson = objectMapper.writeValueAsString(cycloneDxSbom.sbomJson());
                } catch (JsonProcessingException e) {
                    throw new IllegalStateException("Failed to serialize CycloneDX SBOM for Exhort", e);
                }
            }
            boolean componentDependencyTriageFailed = false;
            if (!skipExhortDependencyTriage) {
                try {
                    String analysisResponse = exhortService.requestAnalysis(cycloneDxJson, vulnerabilityId);
                    exhortAnalysisForDump = analysisResponse;
                    if (!exhortResponseParser.cveFoundInAnalysisResponse(
                            analysisResponse, vulnerabilityId, cycloneDxSbom.sbomJson())) {
                        LOGGER.infof("CVE not found in Exhort analysis response for component: %s", component.name());
                        ExcludedComponent excludedComponent =
                                new ExcludedComponent(component.name(), component.version(), component.image(), null, ExclusionType.dependency_not_present);
                        productRepositoryService.addExcludedComponent(productId, excludedComponent);
                        return;
                    }
                    LOGGER.infof("CVE found in Exhort analysis response for component: %s", component.name());
                } catch (ExhortCveGateException e) {
                    if (exhortAnalysisForDump == null) {
                        exhortAnalysisForDump = syftExhortDebugDumpService.jsonTriageInterpretationFailure(e.getMessage());
                    }
                    LOGGER.warnf(
                            "Dependency analytics failed for component %s; proceeding with full analysis (%s)",
                            component.name(),
                            e.getMessage());
                    componentDependencyTriageFailed = true;
                }
            } else {
                exhortAnalysisForDump = syftExhortDebugDumpService.jsonSkippedTriage();
            }

            reportData =
                reportService.createCycloneDxReportData(cycloneDxSbom, productId, vulnerabilityId, true, componentDependencyTriageFailed);
            String reportId = reportData.reportRequestId().reportId();
            if (Objects.nonNull(credentialId) && Objects.nonNull(reportData.report())) {
                LOGGER.infof("Injecting credential ID into report for component: %s", credentialId, component.name());
                credentialProcessingService.injectCredentialId(reportData.report(), credentialId);
            }
            LOGGER.infof("Created report %s for component: %s", reportId, component.name());
        } catch (SyftExecutionException e) {
            // Pre-save failure: Syft-specific error
            // Expected exception - message is ready to use
            String image = e.getImage();
            LOGGER.errorf("Syft failed for component %s (image: %s): %s", component.name(), image, e.getMessage());
            syftExhortDebugDumpService.dumpSyftFailure(productId, vulnerabilityId, component, e.getMessage());
            productRepositoryService.addExcludedComponent(productId, new ExcludedComponent(component.name(), component.version(), component.image(), e.getMessage(), ExclusionType.error));
            return; // Exit early - no report to save
        } catch (SbomValidationException e) {
            // Pre-save failure: Validation error
            LOGGER.errorf("Sbom validation error for component %s: %s", component.name(), e.getMessage());
            syftExhortDebugDumpService.dumpSyftFailure(productId, vulnerabilityId, component, userFacingMessageForSbomSubmissionFailure(e));
            productRepositoryService.addExcludedComponent(productId, new ExcludedComponent(component.name(), component.version(), component.image(), userFacingMessageForSbomSubmissionFailure(e), ExclusionType.error));
            return; // Exit early - no report to save
        } catch (Exception e) {
            // Pre-save failure: Any other error during report generation
            String errorMessage = getErrorMessage(e);
            LOGGER.errorf(e,"Unexpected error during report generation for component %s: %s", component.name(), errorMessage);
            syftExhortDebugDumpService.dumpSyftFailure(productId, vulnerabilityId, component, errorMessage);
            productRepositoryService.addExcludedComponent(productId, new ExcludedComponent(component.name(), component.version(), component.image(), "Unexpected error during report generation", ExclusionType.error));
            return; // Exit early - no report to save
        } finally {
            syftExhortDebugDumpService.dumpCycloneDxAndExhort(
                    productId, vulnerabilityId, component, cycloneDxJson, exhortAnalysisForDump);
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
            // Post-save failure: error during save or submit - update report or excludedComponents
            if (savedReportData != null) {
                String reportId = savedReportData.reportRequestId().id();
                String errorMessage = getErrorMessage(e);
                LOGGER.errorf("Failed to submit report %s for component %s: %s", reportId, component.name(), errorMessage);
                String formattedErrorMessage = formatErrorMessage(e,"Unexpected error while submitting report");
                reportRepositoryService.updateWithError(reportId, "submit-error", formattedErrorMessage);
            } else {
                LOGGER.errorf("Failed to save report for component %s: %s", component.name(), getErrorMessage(e));
                productRepositoryService.addExcludedComponent(productId, new ExcludedComponent(component.name(), component.version(), component.image(), formatErrorMessage(e,"Unexpected error while saving report"), ExclusionType.error));
            }
        }
    }

    /**
     * User-visible submission failure text (e.g. Excluded components table). Uses {@link SbomValidationException#getMessage()},
     * which includes explicit image-metadata wording for structured issues.
     */
    private static String userFacingMessageForSbomSubmissionFailure(SbomValidationException e) {
        return SYFT_INVALID_SBOM_PREFIX + e.getMessage();
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
     * Each batch is scheduled on the managed executor ({@code runAsync}); this method returns without
     * waiting for batches to finish. Within each async task, components run sequentially. The executor
     * caps concurrent work (see {@code maxAsync} / {@code maxQueued} on the injected executor).
     *
     * @param components List of components to process
     * @param productId The product ID
     * @param metadata Additional metadata
     * @param vulnerabilityId Optional vulnerability ID to include in all component reports
     * @param credentialId Optional credential ID to inject into all component reports
     */
    public void processComponents(List<ComponentInfo> components, String productId,
                                 Map<String, String> metadata, String vulnerabilityId, String credentialId) {
        boolean exhortHealthy = exhortHealthProbe.isHealthy();
        boolean skipExhortDependencyTriage = !exhortHealthy;
        if (!exhortHealthy) {
            LOGGER.warnf("Exhort health probe failed for product %s; skipping dependency triage for all components", productId);
            productRepositoryService.setDependencyTriageUnavailable(productId, true);
        }

        if (components.isEmpty()) {
            throw new IllegalArgumentException("No components to process");
        }

        LOGGER.infof("Processing %d components in batches of %d (skipExhortDependencyTriage=%s)",
                components.size(), BATCH_SIZE, skipExhortDependencyTriage);

        for (int i = 0; i < components.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, components.size());
            final List<ComponentInfo> batch = new ArrayList<>(components.subList(i, end));
            executorService.runAsync(() -> {
                for (ComponentInfo component : batch) {
                    try {
                        this.processComponent(component, productId, metadata, vulnerabilityId, credentialId, skipExhortDependencyTriage);
                    } catch (Exception e) {
                        String errorMessage = getErrorMessage(e);
                        LOGGER.errorf("Unexpected error processing component %s: %s", component.name(), errorMessage);
                    }
                }
            });
        }
    }
}
