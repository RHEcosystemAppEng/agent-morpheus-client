package com.redhat.ecosystemappeng.morpheus.model;

import jakarta.ws.rs.BadRequestException;

public interface CredentialData {
    String secretValue();

    String username();

    default CredentialType detectType() {
        String value = secretValue().trim();
        if (value.startsWith("-----BEGIN") && value.contains("-----END")) {
            return CredentialType.SSH_KEY;
        }
        return CredentialType.PAT;
    }

    default void validate() {
        if (secretValue() == null || secretValue().isBlank()) {
            throw new BadRequestException("Secret value is required");
        }
        if (detectType() == CredentialType.PAT && (username() == null || username().isBlank())) {
            throw new BadRequestException("Username is required for PAT authentication");
        }
    }
}