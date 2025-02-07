package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import java.util.Collection;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record Scan(String id, Collection<VulnId> vulns) {
  
}
