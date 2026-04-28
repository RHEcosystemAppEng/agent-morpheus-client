/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.CredentialType;
import com.redhat.ecosystemappeng.morpheus.model.InlineCredential;

import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;
import java.util.Base64;
import java.util.Objects;

/**
 * Service for secure, temporary storage of credentials with AES-256-GCM encryption.
 * Credentials are stored in-memory with TTL equal to queue timeout and automatically
 * deleted after first retrieval.
 */
@ApplicationScoped
public class CredentialStoreService {

    private static final Logger LOGGER = Logger.getLogger(CredentialStoreService.class);
    private static final String AES_ALGORITHM_GCM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final Duration credentialTTL;

    private final ConcurrentHashMap<String, EncryptedCredential> credentialStore = new ConcurrentHashMap<>();
    private final SecretKey secretKey;
    public CredentialStoreService(
        @ConfigProperty(name = "morpheus.queue.timeout") Duration timeout, 
        @ConfigProperty(name = "morpheus.credential-store.encryption-key") String encryptionKey) {
        this.credentialTTL = timeout;
        byte[] keyBytes = encryptionKey.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "Encryption key must be at least 32 bytes for AES-256 (current: " + keyBytes.length + ")");
        }
        this.secretKey = new SecretKeySpec(keyBytes, 0, 32, "AES");
        LOGGER.infof("Credential store initialized (TTL: %d seconds)", credentialTTL.toSeconds());
    }

    /**
     * Stores an encrypted credential with TTL equal to queue timeout.
     * The credential will be automatically deleted after first retrieval
     *
     * @param userId user identifier from JWT (required, non-blank)
     * @param credentialId unique credential identifier, typically UUID (required, non-blank)
     * @param credential inline credential containing secret value and optional username (required)
     * @throws IllegalArgumentException if any parameter is null or blank
     * @throws CredentialStorageException if encryption fails
     */
    public void store(String userId, String credentialId, InlineCredential credential) {
        if (Objects.isNull(userId) || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (Objects.isNull(credentialId) || credentialId.isBlank()) {
            throw new IllegalArgumentException("credentialId is required");
        }
        if (Objects.isNull(credential)) {
            throw new IllegalArgumentException("credential is required");
        }

        try {
            String secretValue = credential.secretValue();
            String username = credential.userName();
            CredentialType type = credential.detectType();

            EncryptedCredential encrypted = encrypt(userId, secretValue, username, type.name());
            credentialStore.put(credentialId, encrypted);

            LOGGER.debugf("Stored credential for userId: %s, credentialId: %s, type: %s",
                          userId, credentialId, type);
        } catch (Exception e) {
            throw new CredentialStorageException("Failed to store credential", e);
        }
    }

    private EncryptedCredential encrypt(String userId, String secretValue, String username, String credentialType) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        SECURE_RANDOM.nextBytes(iv);
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM_GCM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encryptedSecret = cipher.doFinal(secretValue.getBytes(StandardCharsets.UTF_8));

        long expiresAt = System.currentTimeMillis() + credentialTTL.toMillis();
        return new EncryptedCredential(encryptedSecret, iv, userId, username, credentialType, expiresAt);
    }

    /**
     * Retrieves an encrypted credential, then immediately deletes it.
     *
     * @param credentialId unique credential identifier (required, non-blank)
     * @return encrypted credential data (base64-encoded) for decryption by the external agent
     * @throws IllegalArgumentException if credentialId is null or blank
     * @throws NotFoundException if credential not found or expired
     */
    public CredentialData retrieve(String credentialId) {
        if (Objects.isNull(credentialId) || credentialId.isBlank()) {
            throw new IllegalArgumentException("credentialId is required");
        }

        EncryptedCredential encrypted = credentialStore.remove(credentialId);

        if (Objects.isNull(encrypted)) {
            throw new NotFoundException("Credential not found");
        }

        if (encrypted.isExpired()) {
            LOGGER.warnf("Attempted to retrieve expired credential: credentialId=%s, owner=%s",
                         credentialId, encrypted.userId());
            throw new NotFoundException("Credential expired");
        }

        LOGGER.infof("Credential %s (owner: %s, type: %s) retrieved by agent",
                     credentialId, encrypted.userId(), encrypted.credentialType());

        return new CredentialData(
            Base64.getEncoder().encodeToString(encrypted.encryptedSecretValue()),
            Base64.getEncoder().encodeToString(encrypted.iv()),
            encrypted.username(),
            encrypted.credentialType(),
            encrypted.userId()
        );
    }

    @Scheduled(every = "1m")
    void cleanupExpired() {
        try {
            int sizeBefore = credentialStore.size();
            credentialStore.entrySet().removeIf(e -> e.getValue().isExpired());
            int removed = sizeBefore - credentialStore.size();

            if (removed > 0) {
                LOGGER.infof("Removed %d expired credentials", removed);
            }
        } catch (Exception e) {
            LOGGER.errorf(e, "Failed to cleanup expired credentials");
        }
    }

    /**
     * Internal record for storing encrypted credential data with metadata.
     */
    private record EncryptedCredential(
        byte[] encryptedSecretValue,
        byte[] iv,
        String userId,
        String username,
        String credentialType,
        long expiresAt
    ) {
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    /**
     * Encrypted credential data returned to caller for decryption by the external agent.
     *
     * @param encryptedSecretValue base64-encoded AES-256-GCM encrypted secret
     * @param iv base64-encoded initialization vector for AES-256-GCM decryption
     * @param username Git username for PAT authentication (may be null for SSH)
     * @param credentialType credential type ("PAT" or "SSH_KEY")
     * @param userId owner user ID for authorization check
     */
    @RegisterForReflection
    public record CredentialData(
        String encryptedSecretValue,
        String iv,
        String username,
        String credentialType,
        String userId
    ) {}
}