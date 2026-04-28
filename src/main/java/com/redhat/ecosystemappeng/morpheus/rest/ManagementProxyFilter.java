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

package com.redhat.ecosystemappeng.morpheus.rest;

import io.smallrye.mutiny.Uni;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.ext.web.client.WebClient;
import io.vertx.mutiny.ext.web.codec.BodyCodec;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.RestResponse;
import org.jboss.resteasy.reactive.server.ServerRequestFilter;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ManagementProxyFilter {

    @Inject
    WebClient client;

    @ConfigProperty(name = "quarkus.management.port", defaultValue = "9000")
    int managementPort;

    @ConfigProperty(name = "quarkus.management.proxy.paths", defaultValue = "/health")
    List<String> proxyPaths;

    @ServerRequestFilter(preMatching = true, nonBlocking = true)
    public Uni<RestResponse<String>> proxyManagement(ContainerRequestContext ctx) {
        String path = ctx.getUriInfo().getPath();

        Optional<String> matchedPath = proxyPaths.stream()
                .filter(proxyPath -> path.equals(proxyPath) || path.startsWith(proxyPath + "/"))
                .findFirst();

        if (matchedPath.isEmpty())
            return Uni.createFrom().nullItem();

        return client.get(managementPort, "127.0.0.1", "/q" + path)
                .as(BodyCodec.buffer())
                .send()
                .ifNoItem().after(Duration.ofSeconds(2)).fail()
                .onItem().transform(resp -> {
                    String body = resp.body() != null ? resp.body().toString() : "";
                    return RestResponse.ResponseBuilder.<String>create(resp.statusCode())
                            .entity(body)
                            .header("Content-Type", resp.getHeader("Content-Type"))
                            .build();
                })
                .onFailure()
                .recoverWithItem(
                        e -> RestResponse.ResponseBuilder.<String>create(RestResponse.Status.SERVICE_UNAVAILABLE)
                                .entity("{\"status\":\"DOWN\",\"error\":\"Management interface is not available: "
                                        + e.getMessage() + "\"}")
                                .header("Content-Type", "application/json")
                                .build());
    }
}

@ApplicationScoped
class ClientProducer {

    @Inject
    Vertx vertx;

    @Produces
    @ApplicationScoped
    public WebClient createWebClient() {
        return WebClient.create(vertx);
    }
}