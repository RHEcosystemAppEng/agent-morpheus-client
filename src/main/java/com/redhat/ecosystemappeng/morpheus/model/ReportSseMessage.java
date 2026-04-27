package com.redhat.ecosystemappeng.morpheus.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.quarkus.runtime.annotations.RegisterForReflection;
/**
 * Payload for {@code text/event-stream} items (JSON per event). Clients refetch REST; this is only invalidation.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@RegisterForReflection
public record ReportSseMessage(String type, String reportId, String productId) {
}
