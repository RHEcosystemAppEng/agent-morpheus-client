package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ProductSummary(
    Product data,
    ProductReportsSummary summary
) {} 