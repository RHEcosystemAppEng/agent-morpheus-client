package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import java.util.Collection;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SourceInfo(String type, @JsonProperty("git_repo") String gitRepo, String ref, Collection<String> include, Collection<String> exclude) {
  
}
