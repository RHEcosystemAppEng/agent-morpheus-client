package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Set;
import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection

public record ProductReportSummary(
    String id,
    String productName,
    String productVersion,
    String submittedAt,
    String completedAt,
    int submittedCount,
    int scannedCount,
    int failedCount,
    int completedCount,
    String state,
    Map<String, Set<Justification>> cves) {

}