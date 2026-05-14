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

import java.time.Duration;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Probes Exhort (Trustify Dependency Analytics) availability once per logical check.
 * Hosted deployments often omit {@code GET /q/health/*}; this uses {@code POST /api/v5/analysis}
 * with the same minimal CycloneDX body as {@code scripts/query-exhort-health.sh}.
 */
@ApplicationScoped
public class ExhortHealthProbe {

    private static final Logger LOGGER = Logger.getLogger(ExhortHealthProbe.class);

    /** Same payload as {@code MINIMAL_CYCLONEDX} in {@code scripts/query-exhort-health.sh}. */
    private static final String MINIMAL_CYCLONEDX_JSON =
            "{\"bomFormat\":\"CycloneDX\",\"specVersion\":\"1.6\",\"version\":1,\"metadata\":{\"component\":{\"type\":\"application\",\"bom-ref\":\"probe\",\"name\":\"health-probe\",\"version\":\"0\"}}}";

    private static final String ANALYSIS_PATH = "/api/v5/analysis";

    @Inject
    WebClient client;

    @ConfigProperty(name = "quarkus.rest-client.exhort.url")
    String exhortBaseUrl;

    @ConfigProperty(name = "morpheus.exhort.health.timeout", defaultValue = "5s")
    Duration healthTimeout;

    /**
     * @return true iff {@code POST /api/v5/analysis} returns HTTP 2xx within the configured timeout
     */
    public boolean isHealthy() {
        String url = concatenateBasePath(exhortBaseUrl, ANALYSIS_PATH);
        try {
            int code = client
                    .postAbs(url)
                    .putHeader("Content-Type", "application/vnd.cyclonedx+json")
                    .putHeader("Accept", "application/json")
                    .sendBuffer(Buffer.buffer(MINIMAL_CYCLONEDX_JSON))
                    .await().atMost(healthTimeout)
                    .statusCode();
            boolean ok = code >= 200 && code < 300;
            if (!ok) {
                LOGGER.warnf("Exhort health probe POST %s returned HTTP %d", url, code);
            }
            return ok;
        } catch (Exception e) {
            // Expected when Exhort is unreachable (DNS, network, etc.); log briefly without stack trace.
            LOGGER.warnf("Exhort health probe failed: %s", rootCauseMessage(e));
            return false;
        }
    }

    private static String rootCauseMessage(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null && t != t.getCause()) {
            t = t.getCause();
        }
        String msg = t.getMessage();
        return msg != null && !msg.isBlank() ? msg : t.getClass().getSimpleName();
    }

    static String concatenateBasePath(String baseUrl, String path) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return path == null ? "" : path;
        }
        String trimmedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (path == null || path.isBlank()) {
            return trimmedBase;
        }
        String p = path.startsWith("/") ? path : "/" + path;
        return trimmedBase + p;
    }
}
