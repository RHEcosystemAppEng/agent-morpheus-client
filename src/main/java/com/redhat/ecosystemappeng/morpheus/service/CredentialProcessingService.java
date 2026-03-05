package com.redhat.ecosystemappeng.morpheus.service;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.model.InlineCredential;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import java.util.Objects;

@ApplicationScoped
public class CredentialProcessingService {

    private static final Logger LOGGER = Logger.getLogger(CredentialProcessingService.class);

    @Inject
    CredentialStoreService credentialStoreService;

    /**
     * Processes inline credential and stores encrypted in-memory.
     *
     * @param credential credential from FormData or JSON (may be null)
     * @param userId authenticated user ID from JWT SecurityContext
     * @return credentialId if credential provided and stored, null otherwise
     * @throws IllegalArgumentException if userId is null/blank or credential validation fails
     * @throws CredentialStorageException if encryption/storage fails
     */
    public String processAndStoreCredential(InlineCredential credential, String userId) {
        if (Objects.isNull(credential) || Objects.isNull(credential.secretValue()) || credential.secretValue().isBlank()) {
            return null;
        }

        if (Objects.isNull(userId) || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required for credential storage");
        }

        credential.validate();

        String credentialId = UUID.randomUUID().toString();
        credentialStoreService.store(userId, credentialId, credential);

        LOGGER.infof("User %s created credential %s (type: %s)",
                     userId, credentialId, credential.detectType());

        return credentialId;
    }

    /**
     * Injects credentialId into report JSON payload for Agent consumption.
     *
     * @param reportNode JsonNode representing the report payload
     * @param credentialId credential identifier (may be null)
     */
    public void injectCredentialId(JsonNode reportNode, String credentialId) {
        if (Objects.isNull(reportNode)) {
            throw new IllegalArgumentException("reportNode is required");
        }

        if (Objects.isNull(credentialId) || credentialId.isBlank()) {
            return;
        }

        ObjectNode inputNode = (ObjectNode) reportNode.get("input");
        if (Objects.nonNull(inputNode)) {
            inputNode.put("credentialId", credentialId);
            LOGGER.debugf("Injected credentialId into report payload: %s", credentialId);
        } else {
            LOGGER.warnf("Cannot inject credentialId: 'input' node not found in report payload");
        }
    }
}
