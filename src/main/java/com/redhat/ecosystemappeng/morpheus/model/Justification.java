package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record Justification(String status, String label) {
  
}
