package com.redhat.ecosystemappeng.morpheus.health;

import io.smallrye.health.api.HealthGroup;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Duration;

import org.eclipse.microprofile.health.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@HealthGroup("dependencies")
@ApplicationScoped
public class ComponentSyncerHealthCheck implements HealthCheck {

    @Inject
    WebClient client;

    @ConfigProperty(name = "morpheus.syncer.health.url")
    String componentSyncerHealthUrl;

    @ConfigProperty(name = "morpheus.syncer.health.timeout")
    Duration componentSyncerHealthTimeout;
    // Intentionally send an invalid payload to check service availability, but
    // not to initiate job creation.
    private static final int EXPECTED_STATUS = 400;

    @Override
    public HealthCheckResponse call() {
        try {
            int code = client
                    .postAbs(componentSyncerHealthUrl)
                    .send()
                    .await().atMost(componentSyncerHealthTimeout)
                    .statusCode();

            return HealthCheckResponse.named("component-syncer")
                    .status(code == EXPECTED_STATUS)
                    .withData("status_code", code)
                    .withData("url", componentSyncerHealthUrl)
                    .build();

        } catch (Exception e) {
            return HealthCheckResponse.named("component-syncer")
                    .down()
                    .withData("error", "unreachable")
                    .withData("reason", (HealthUtils.resolveReason(e)))
                    .build();
        }

    }
}

