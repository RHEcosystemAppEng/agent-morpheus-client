package com.redhat.ecosystemappeng.morpheus.model;

import java.util.List;
import java.util.Set;
import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection

public record ProductReportsSummary(
    String productState,
    List<String> componentStates,
    Map<String, Set<Justification>> cves) {

}