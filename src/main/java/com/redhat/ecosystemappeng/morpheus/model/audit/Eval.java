package com.redhat.ecosystemappeng.morpheus.model.audit;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;

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
    @NotEmpty
    private LLMStage llmNode;
    @JsonProperty(METRIC_NAME_FIELD_NAME)
    @NotEmpty
    private String metricName;
    @NotEmpty
    @JsonProperty(METRIC_VALUE_FIELD_NAME)
    private String metricValue;


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

    public String getMetricName() {
        return metricName;
    }

    public void setMetricName(String metricName) {
        this.metricName = metricName;
    }

    public String getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(String metricValue) {
        this.metricValue = metricValue;
    }

    public LLMStage getLlmNode() {
        return llmNode;
    }

    public void setLlmNode(LLMStage llmNode) {
        this.llmNode = llmNode;
    }
}
