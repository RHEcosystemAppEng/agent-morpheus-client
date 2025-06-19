package com.redhat.ecosystemappeng.morpheus.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record PreProcessingRequest(
    String specversion,
    String id,
    String source,
    String type,
    String datacontenttype,
    List<DataEntry> data
) {
    @RegisterForReflection
    public static record DataEntry(
        @JsonProperty("report_id")
        String reportId,
        @JsonProperty("source_info")
        List<Object> sourceInfo
    ) {}
}
