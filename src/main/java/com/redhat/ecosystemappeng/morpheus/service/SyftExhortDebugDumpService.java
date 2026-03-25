/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.redhat.ecosystemappeng.morpheus.service.SpdxParsingService.ComponentInfo;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Optional filesystem dump of Syft CycloneDX output and Exhort analysis responses for local debugging.
 * Enabled when {@code morpheus.syft-exhort.debug.dump-directory} is non-blank.
 */
@ApplicationScoped
public class SyftExhortDebugDumpService {

    private static final Logger LOGGER = Logger.getLogger(SyftExhortDebugDumpService.class);

    private static final int MAX_SEGMENT_LEN = 120;

    @ConfigProperty(name = "morpheus.syft-exhort.debug.dump-directory")
    Optional<String> dumpDirectory;

    @Inject
    ObjectMapper objectMapper;

    public boolean isEnabled() {
        return dumpDirectory.filter(s -> !s.isBlank()).isPresent();
    }

    private String dumpRoot() {
        return dumpDirectory.map(String::trim).filter(s -> !s.isBlank()).orElse("");
    }

    /**
     * Reformats JSON for readable debug dumps. On parse failure, returns the original string and logs at
     * debug level.
     */
    private String prettifyJsonOrKeepRaw(String json) {
        if (json == null || json.isBlank()) {
            return json;
        }
        try {
            return objectMapper
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(objectMapper.readTree(json));
        } catch (JsonProcessingException e) {
            LOGGER.debugf(e, "Debug dump content is not valid JSON; writing raw (%d bytes)", json.length());
            return json;
        }
    }

    /**
     * Writes {@code cyclonedx.json} and {@code exhort-response.json} under
     * {@code <dump-directory>/<productId>/<cve>/<component-id>/} when enabled and {@code cyclonedxJson} is
     * non-null. Never throws to callers; logs I/O failures at warn level.
     */
    public void dumpCycloneDxAndExhort(
            String productId,
            String vulnerabilityId,
            ComponentInfo component,
            String cyclonedxJson,
            String exhortResponseJson) {
        if (!isEnabled()) {
            return;
        }
        try {
            Path dir = resolveDumpDir(productId, vulnerabilityId, component);
            Files.createDirectories(dir);
            Files.writeString(dir.resolve("cyclonedx.json"), prettifyJsonOrKeepRaw(cyclonedxJson), StandardCharsets.UTF_8);
            String exhortBody =
                    exhortResponseJson != null
                            ? prettifyJsonOrKeepRaw(exhortResponseJson)
                            : objectMapper
                                    .writerWithDefaultPrettyPrinter()
                                    .writeValueAsString(
                                            Map.of(
                                                    "_exhortResponseMissing",
                                                    true,
                                                    "reason",
                                                    "no_exhort_body_recorded"));
            Files.writeString(dir.resolve("exhort-response.json"), exhortBody, StandardCharsets.UTF_8);
            LOGGER.infof("Syft/Exhort debug dump written under %s", dir);
        } catch (Exception e) {
            LOGGER.warnf(e, "Syft/Exhort debug dump failed (continuing processing)");
        }
    }

    /**
     * When Syft fails before CycloneDX is available, writes {@code syft-error.txt} under the same directory
     * layout (no {@code cyclonedx.json}).
     */
    public void dumpSyftFailure(String productId, String vulnerabilityId, ComponentInfo component, String message) {
        if (!isEnabled()) {
            return;
        }
        try {
            Path dir = resolveDumpDir(productId, vulnerabilityId, component);
            Files.createDirectories(dir);
            String text = Objects.requireNonNullElse(message, "");
            Files.writeString(dir.resolve("syft-error.txt"), text, StandardCharsets.UTF_8);
            LOGGER.infof("Syft failure debug dump written under %s", dir);
        } catch (IOException | RuntimeException e) {
            LOGGER.warnf(e, "Syft failure debug dump failed (continuing processing)");
        }
    }

    public String jsonSkippedTriage() {
        try {
            return objectMapper.writeValueAsString(
                    Map.of("_exhortSkipped", true, "reason", "dependency_triage_unavailable"));
        } catch (JsonProcessingException e) {
            return "{\"_exhortSkipped\":true,\"reason\":\"dependency_triage_unavailable\"}";
        }
    }

    public String jsonTriageInterpretationFailure(String message) {
        try {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("_exhortTriageInterpretationFailed", true);
            m.put("message", message != null ? message : "");
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException e) {
            return "{\"_exhortTriageInterpretationFailed\":true}";
        }
    }

    Path resolveDumpDir(String productId, String vulnerabilityId, ComponentInfo component) {
        Path root = Path.of(dumpRoot()).toAbsolutePath().normalize();
        String cve = sanitizeSegment(blankToPlaceholder(vulnerabilityId, "no-cve"));
        String comp = sanitizeSegment(componentPathKey(component));
        Path out = root.resolve(sanitizeSegment(productId)).resolve(cve).resolve(comp).normalize();
        if (!out.startsWith(root)) {
            throw new IllegalStateException("Resolved debug path escapes dump root");
        }
        return out;
    }

    static String componentPathKey(ComponentInfo component) {
        if (component.spdxId() != null && !component.spdxId().isBlank()) {
            return component.spdxId().trim();
        }
        return component.name() + "_" + Objects.toString(component.version(), "");
    }

    static String blankToPlaceholder(String value, String placeholder) {
        if (value == null || value.isBlank()) {
            return placeholder;
        }
        return value.trim();
    }

    static String sanitizeSegment(String raw) {
        if (raw == null || raw.isBlank()) {
            return "unknown";
        }
        StringBuilder sb = new StringBuilder(Math.min(raw.length(), MAX_SEGMENT_LEN));
        for (int i = 0; i < raw.length() && sb.length() < MAX_SEGMENT_LEN; i++) {
            char c = raw.charAt(i);
            if (Character.isLetterOrDigit(c) || c == '.' || c == '_' || c == '-') {
                sb.append(c);
            } else {
                sb.append('_');
            }
        }
        String s = sb.toString();
        return s.isBlank() ? "unknown" : s;
    }
}
