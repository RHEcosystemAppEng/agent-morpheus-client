package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Request body for POST /api/v1/reports/failed.
 */
@RegisterForReflection
public record MarkReportFailedRequest(
    String scanId,
    String errorType,
    String errorMessage
) {}
