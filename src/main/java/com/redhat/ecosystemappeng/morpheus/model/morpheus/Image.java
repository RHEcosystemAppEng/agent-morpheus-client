package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import java.util.Collection;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record Image(String name, String tag, @JsonProperty("source_info") Collection<SourceInfo> sourceInfo, @JsonProperty("sbom_info") JsonNode sbomInfo) {
  
}
