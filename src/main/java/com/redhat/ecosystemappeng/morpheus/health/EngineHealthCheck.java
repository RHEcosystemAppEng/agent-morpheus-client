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

package com.redhat.ecosystemappeng.morpheus.health;

import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Duration;

import org.eclipse.microprofile.health.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Readiness
@ApplicationScoped
public class EngineHealthCheck implements HealthCheck {

    @Inject
    WebClient client;

    @ConfigProperty(name = "morpheus.engine.health.url")
    String engineHealthUrl;

    @ConfigProperty(name = "morpheus.engine.health.timeout")
    Duration engineHealthTimeout;

    private static final int EXPECTED_STATUS = 200;

    @Override
    public HealthCheckResponse call() {
        try {
            int code = client
                    .getAbs(engineHealthUrl)
                    .send()
                    .await().atMost(engineHealthTimeout)
                    .statusCode();

            return HealthCheckResponse.named("engine")
                    .status(code == EXPECTED_STATUS)
                    .withData("status_code", code)
                    .build();

        } catch (Exception e) {
            return HealthCheckResponse.named("engine")
                    .down()
                    .withData("error", "unreachable")
                    .withData("reason", (HealthUtils.resolveReason(e)))
                    .build();
        }

    }
}

