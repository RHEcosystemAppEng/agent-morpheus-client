package com.redhat.ecosystemappeng.morpheus.model.audit;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Map;

import static com.redhat.ecosystemappeng.morpheus.repository.JobRepositoryService.*;


@RegisterForReflection
public class Trace {
    @JsonProperty(JOB_ID_FIELD_NAME)
    @NotEmpty
    private String jobId;
    @PastOrPresent
    @JsonProperty(EXECUTION_START_TIMESTAMP)
    private LocalDateTime executionTimestamp;
    @NotEmpty
    @JsonProperty(TRACE_ID_FIELD_NAME)
    private String traceId;
    @NotEmpty
    @JsonProperty(SPAN_ID_FIELD_NAME)
    private String spanId;
    @JsonAnySetter
    @Schema(description = "free style span payload without restrictions")
    @JsonProperty("span_payload")
    private Map<String, Object> spanPayload;


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

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getSpanId() {
        return spanId;
    }

    public void setSpanId(String spanId) {
        this.spanId = spanId;
    }

    public Map<String, Object> getSpanPayload() {
        return spanPayload;
    }

    public void setSpanPayload(Map<String, Object> spanPayload) {
        this.spanPayload = spanPayload;
    }
}
