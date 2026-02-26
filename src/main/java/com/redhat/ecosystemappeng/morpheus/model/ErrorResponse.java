package com.redhat.ecosystemappeng.morpheus.model;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Standard error response for REST API endpoints.
 * Automatically serialized to JSON by Quarkus.
 *
 * <p>Example JSON output:
 * <pre>
 * {
 *   "error": "userId is required"
 * }
 * </pre>
 */
@Schema(name = "ErrorResponse", description = "Standard error response")
@RegisterForReflection
public record ErrorResponse(
    @Schema(required = true, description = "Error message describing what went wrong")
    String error
) {}
