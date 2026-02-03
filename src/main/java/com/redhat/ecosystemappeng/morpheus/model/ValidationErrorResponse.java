package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Map;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import io.quarkus.runtime.annotations.RegisterForReflection;

@Schema(name = "ValidationErrorResponse", description = "Validation error response mapping field names to error messages")
@RegisterForReflection
public record ValidationErrorResponse(
    @Schema(description = "Map of field names to error messages")
    Map<String, String> errors) {

}

