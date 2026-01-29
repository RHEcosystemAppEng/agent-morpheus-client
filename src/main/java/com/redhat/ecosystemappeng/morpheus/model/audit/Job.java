package com.redhat.ecosystemappeng.morpheus.model.audit;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Map;

import static com.redhat.ecosystemappeng.morpheus.repository.JobRepositoryService.*;
import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.REGEX_ALLOWED_LANGUAGES;
import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.REGEX_PATTERN_FOR_CVE;

@RegisterForReflection
public class Job {
    @JsonProperty(JOB_ID_FIELD_NAME)
    private String jobId;
    @PastOrPresent
    @JsonProperty(EXECUTION_START_TIMESTAMP)
    private LocalDateTime executionTimestamp;
    @JsonProperty("duration_in_seconds")
    private String durationInSeconds;
    @JsonProperty(CVE_FIELD_NAME)
    @Pattern(regexp = REGEX_PATTERN_FOR_CVE)
    private String cve;
    @JsonProperty(LANGUAGE_FIELD_NAME)
    @Pattern(regexp = REGEX_ALLOWED_LANGUAGES)
    private String appLanguage;
    @JsonProperty(COMPONENT_FIELD_NAME)
    private String component;
    @JsonProperty(COMPONENT_VERSION_FIELD_NAME)
    private String componentVersion;
    @JsonProperty("agent_git_commit")
    private String agentGitCommit;
    @JsonProperty("agent_git_tag")
    private String agentGitTag;
    @JsonProperty("agent_config_b64")
    private String agentConfigB64;
    @JsonProperty("concrete_intel_sources_b64")
    private String concreteIntelSourcesB64;
    @JsonProperty("executed_from_background_process")
    private Boolean executedFromBatchProcess;
    @JsonProperty(BATCH_ID_FIELD_NAME)
    private String batchId;
    @JsonProperty("success_status")
    private Boolean successStatus;
    @JsonProperty("env_vars")
    @Schema(required = true, description = "comma delimited key=value pairs")
    private String envVars;
    @JsonAnySetter
    @JsonProperty("job_output")
    private Map<String, Object> jobOutput;


    public LocalDateTime getExecutionTimestamp() {
        return executionTimestamp;
    }

    public void setExecutionTimestamp(LocalDateTime executionTimestamp) {
        this.executionTimestamp = executionTimestamp;
    }

    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public String getCve() {
        return cve;
    }

    public void setCve(String cve) {
        this.cve = cve;
    }

    public String getAppLanguage() {
        return appLanguage;
    }

    public void setAppLanguage(String appLanguage) {
        this.appLanguage = appLanguage;
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

    public String getAgentGitCommit() {
        return agentGitCommit;
    }

    public void setAgentGitCommit(String agentGitCommit) {
        this.agentGitCommit = agentGitCommit;
    }

    public String getAgentGitTag() {
        return agentGitTag;
    }

    public void setAgentGitTag(String agentGitTag) {
        this.agentGitTag = agentGitTag;
    }

    public String getAgentConfigB64() {
        return agentConfigB64;
    }

    public void setAgentConfigB64(String agentConfigB64) {
        this.agentConfigB64 = agentConfigB64;
    }

    public String getConcreteIntelSourcesB64() {
        return concreteIntelSourcesB64;
    }

    public void setConcreteIntelSourcesB64(String concreteIntelSourcesB64) {
        this.concreteIntelSourcesB64 = concreteIntelSourcesB64;
    }

    public Boolean getExecutedFromBatchProcess() {
        return executedFromBatchProcess;
    }

    public void setExecutedFromBatchProcess(Boolean executedFromBatchProcess) {
        this.executedFromBatchProcess = executedFromBatchProcess;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public Boolean getSuccessStatus() {
        return successStatus;
    }

    public void setSuccessStatus(Boolean successStatus) {
        this.successStatus = successStatus;
    }

    public String getEnvVars() {
        return envVars;
    }

    public void setEnvVars(String envVars) {
        this.envVars = envVars;
    }

    public Map<String, Object> getJobOutput() {
        return jobOutput;
    }

    public void setJobOutput(Map<String, Object> jobOutput) {
        this.jobOutput = jobOutput;
    }

    public String getDurationInSeconds() {
        return durationInSeconds;
    }

    public void setDurationInSeconds(String durationInSeconds) {
        this.durationInSeconds = durationInSeconds;
    }
}
