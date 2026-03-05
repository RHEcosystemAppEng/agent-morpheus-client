package com.redhat.ecosystemappeng.morpheus.model;

import jakarta.ws.rs.BadRequestException;
import java.util.Objects;

public interface CredentialData {
    String secretValue();

    String userName();

    default CredentialType detectType() {
        String value = secretValue().trim();
        if (value.startsWith("-----BEGIN") && value.contains("-----END")) {
            return CredentialType.SSH_KEY;
        }
        return CredentialType.PAT;
    }

    default void validate() {
        if (Objects.isNull(secretValue()) || secretValue().isBlank()) {
            throw new BadRequestException("Secret value is required");
        }
        if (detectType() == CredentialType.PAT && (Objects.isNull(userName()) || userName().isBlank())) {
            throw new BadRequestException("Username is required for PAT authentication");
        }
    }
}