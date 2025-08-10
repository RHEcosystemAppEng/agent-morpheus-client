package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;
import java.util.Map;

@RegisterForReflection
public record Product(
    String id,
    String name,
    String version,
    String submittedAt,
    int submittedCount,
    Map<String, String> metadata,
    List<FailedComponent> submissionFailures,
    String completedAt
) {
    public Product(String id, String name, String version, String submittedAt, int submittedCount, Map<String, String> metadata, List<FailedComponent> submissionFailures) {
        this(id, name, version, submittedAt, submittedCount, metadata, submissionFailures, null);
    }
} 