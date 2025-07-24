package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Set;
import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection

public record ProductReportSummary(
    String productId,
    Map<String, Set<String>> cves) {

}