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

package com.redhat.ecosystemappeng.morpheus.model.audit;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.LocalDateTime;

import static com.redhat.ecosystemappeng.morpheus.repository.JobRepositoryService.*;
import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.REGEX_PATTERN_FOR_CVE;

@RegisterForReflection
public class Eval {
    @JsonProperty(JOB_ID_FIELD_NAME)
    @NotEmpty
    private String jobId;
    @PastOrPresent
    @JsonProperty(EXECUTION_START_TIMESTAMP)
    private LocalDateTime executionTimestamp;
    @JsonProperty(TRACE_ID_FIELD_NAME)
    private String traceId;
    @JsonProperty(CVE_FIELD_NAME)
    @Pattern(regexp = REGEX_PATTERN_FOR_CVE)
    @NotEmpty
    private String cve;
    @JsonProperty(COMPONENT_FIELD_NAME)
    @NotEmpty
    private String component;
    @JsonProperty(COMPONENT_VERSION_FIELD_NAME)
    @NotEmpty
    private String componentVersion;
    @JsonProperty(LLM_NODE_FIELD_NAME)
    private LLMStage llmNode;
    @JsonProperty(METRIC_NAME_FIELD_NAME)
    private MetricName metricName;
    @NotEmpty
    @JsonProperty(METRIC_SCORE_FIELD_NAME)
    private String metricScore;
    @JsonProperty(METRIC_REASONING_FIELD_NAME)
    @Schema(description = "Containing the reasoning for the score that was calculated")
    private String metricReasoning;
    @JsonProperty(MODEL_INPUT)
    @Schema(description = "Containing the concrete Input to the agent model That is being evaluated")
    private String modelInput;
    @JsonProperty(MODEL_OUTPUT)
    @Schema(description = "Containing the concrete Output produced by the Agent' Model which is being evaluated")
    private String modelOutput;


    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public LocalDateTime getExecutionTimestamp() {
        return executionTimestamp;
    }

    public void setExecutionTimestamp(LocalDateTime executionTimestamp) {
        this.executionTimestamp = executionTimestamp;
    }

    public String getCve() {
        return cve;
    }

    public void setCve(String cve) {
        this.cve = cve;
    }

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public String getComponentVersion() {
        return componentVersion;
    }

    public void setComponentVersion(String componentVersion) {
        this.componentVersion = componentVersion;
    }

    public MetricName getMetricName() {
        return metricName;
    }

    public void setMetricName(MetricName metricName) {
        this.metricName = metricName;
    }

    public String getMetricScore() {
        return metricScore;
    }

    public void setMetricScore(String metricScore) {
        this.metricScore = metricScore;
    }

    public LLMStage getLlmNode() {
        return llmNode;
    }

    public void setLlmNode(LLMStage llmNode) {
        this.llmNode = llmNode;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    @Override
    public String toString() {
        return "Eval{" +
                "jobId='" + jobId + '\'' +
                ", traceId='" + traceId + '\'' +
                ", cve='" + cve + '\'' +
                ", component='" + component + '\'' +
                ", componentVersion='" + componentVersion + '\'' +
                ", llmNode=" + llmNode +
                ", metricName='" + metricName + '\'' +
                ", metricScore='" + metricScore + '\'' +
                '}';
    }

    public String getMetricReasoning() {
        return metricReasoning;
    }

    public void setMetricReasoning(String metricReasoning) {
        this.metricReasoning = metricReasoning;
    }

    public String getModelInput() {
        return modelInput;
    }

    public void setModelInput(String modelInput) {
        this.modelInput = modelInput;
    }

    public String getModelOutput() {
        return modelOutput;
    }

    public void setModelOutput(String modelOutput) {
        this.modelOutput = modelOutput;
    }
}
