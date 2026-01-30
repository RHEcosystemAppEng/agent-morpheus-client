package com.redhat.ecosystemappeng.morpheus.model.audit;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.*;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;


import static com.redhat.ecosystemappeng.morpheus.repository.JobRepositoryService.*;

@RegisterForReflection
public class Batch {
    @JsonProperty(BATCH_ID_FIELD_NAME)
    private String batchId;
    @PastOrPresent
    @JsonProperty(EXECUTION_START_TIMESTAMP)
    private LocalDateTime executionStartTimestamp;
    @JsonProperty("execution_end_timestamp")
    private LocalDateTime executionEndTimestamp;
    @JsonProperty(BATCH_TYPE_FIELD_NAME)
    private BatchType batchType;
    @JsonProperty(LANGUAGE_FIELD_NAME)
    @Pattern(regexp = "go|python|c|javascript|java|all")
    private String appLanguage;
    @Nullable
    private String duration;
    @PositiveOrZero
    @JsonProperty("total_number_of_executed_jobs")
    private Integer numberOfExecutedJobs;
    @NotEmpty
    @JsonProperty("agent_git_commit")
    private String agentGitCommit;
    @NotEmpty
    @JsonProperty("agent_git_tag")
    private String agentGitTag;
    @NotEmpty
    @JsonProperty("agent_config_b64")
    private String agentConfigB64;
    @NotEmpty
    @JsonProperty("env_vars")
    @Schema(required = true, description = "comma delimited key=value pairs")
    private String envVars;
    @DecimalMin("0.00")
    @DecimalMax("1.00")
    @JsonProperty("confusion_matrix_accuracy")
    private Float confusionMatrixAccuracy;
    @DecimalMin("0.00")
    @DecimalMax("1.00")
    @JsonProperty("confusion_matrix_precision")
    private Float confusionMatrixPrecision;
    @DecimalMin("0.00")
    @DecimalMax("1.00")
    @JsonProperty("confusion_matrix_f1_score")
    private Float confusionMatrixF1Score;
    @DecimalMin("0.00")
    @DecimalMax("1.00")
    @JsonProperty("confusion_matrix_recall")
    private Float confusionMatrixRecall;
    @PositiveOrZero
    @JsonProperty("total_number_of_failures")
    private Integer numberOfFailures;
    @NotNull
    @Size(min = 0)
    @JsonProperty("regressive_jobs_ids")
    private List<String> regressiveJobIds;
    @PositiveOrZero
    @JsonProperty("number_of_regressive_jobs_ids")
    private Integer numberOfRegressiveJobIds;


    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public LocalDateTime getExecutionStartTimestamp() {
        return executionStartTimestamp;
    }

    public void setExecutionStartTimestamp(LocalDateTime executionStartTimestamp) {
        this.executionStartTimestamp = executionStartTimestamp;
    }

    public LocalDateTime getExecutionEndTimestamp() {
        return executionEndTimestamp;
    }

    public void setExecutionEndTimestamp(LocalDateTime executionEndTimestamp) {
        this.executionEndTimestamp = executionEndTimestamp;
    }

    @Nullable
    public String getAppLanguage() {
        return appLanguage;
    }

    public void setAppLanguage(@Nullable String appLanguage) {
        this.appLanguage = appLanguage;
    }

    @Nullable
    public String getDuration() {
        return duration;
    }

    public void setDuration(@Nullable String duration) {
        this.duration = duration;
    }

    public Integer getNumberOfExecutedJobs() {
        return numberOfExecutedJobs;
    }

    public void setNumberOfExecutedJobs(Integer numberOfExecutedJobs) {
        this.numberOfExecutedJobs = numberOfExecutedJobs;
    }

    public Float getConfusionMatrixAccuracy() {
        return confusionMatrixAccuracy;
    }

    public void setConfusionMatrixAccuracy(Float confusionMatrixAccuracy) {
        this.confusionMatrixAccuracy = confusionMatrixAccuracy;
    }

    public Float getConfusionMatrixPrecision() {
        return confusionMatrixPrecision;
    }

    public void setConfusionMatrixPrecision(Float confusionMatrixPrecision) {
        this.confusionMatrixPrecision = confusionMatrixPrecision;
    }

    public Float getConfusionMatrixF1Score() {
        return confusionMatrixF1Score;
    }

    public void setConfusionMatrixF1Score(Float confusionMatrixF1Score) {
        this.confusionMatrixF1Score = confusionMatrixF1Score;
    }

    public Float getConfusionMatrixRecall() {
        return confusionMatrixRecall;
    }

    public void setConfusionMatrixRecall(Float confusionMatrixRecall) {
        this.confusionMatrixRecall = confusionMatrixRecall;
    }

    public Integer getNumberOfFailures() {
        return numberOfFailures;
    }

    public void setNumberOfFailures(Integer numberOfFailures) {
        this.numberOfFailures = numberOfFailures;
    }

    public List<String> getRegressiveJobIds() {
        return regressiveJobIds;
    }

    public void setRegressiveJobIds(List<String> regressiveJobIds) {
        this.regressiveJobIds = regressiveJobIds;
    }

    public Integer getNumberOfRegressiveJobIds() {
        return numberOfRegressiveJobIds;
    }

    public void setNumberOfRegressiveJobIds(Integer numberOfRegressiveJobIds) {
        this.numberOfRegressiveJobIds = numberOfRegressiveJobIds;
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

    public String getEnvVars() {
        return envVars;
    }

    public void setEnvVars(String envVars) {
        this.envVars = envVars;
    }
}
