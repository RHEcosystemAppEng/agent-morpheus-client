package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

@RegisterForReflection
public record Product(
    String id,
    String name,
    String version,
    String submittedAt,
    String completedAt,
    int submittedCount,
    List<FailedComponent> submissionFailures
) {} 