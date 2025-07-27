package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Set;
import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection

public record ProductReportSummary(
    String id,
    String submittedAt,
    String state,
    Map<String, Set<Justification>> cves) {

}