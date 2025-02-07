package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record VulnId(@JsonProperty("vuln_id") String vulnId) {
  
}
