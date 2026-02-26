package com.redhat.ecosystemappeng.morpheus.model;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "InlineCredential", description = "Inline credential for private repository access")
@RegisterForReflection
public record InlineCredential(
    @NotBlank
    @Schema(required = true, description = "The secret value to be encrypted and stored")
    String secretValue,
    @Schema(description = "Git username (required for PAT authentication, ignored for SSH keys)")
    String username) implements CredentialData {
    @Override
    public String toString() {
        return String.format("InlineCredential[secretValue=[REDACTED], username=%s]", username);
    }
}