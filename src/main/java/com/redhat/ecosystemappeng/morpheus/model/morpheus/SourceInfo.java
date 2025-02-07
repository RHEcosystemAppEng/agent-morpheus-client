package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import java.util.Collection;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SourceInfo(String type, String gitRepo, String ref, Collection<String> includes, Collection<String> excludes) {
  
}
