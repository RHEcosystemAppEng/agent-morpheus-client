package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Payload for each {@code text/event-stream} element: JSON {@code {}} meaning “data may have changed; refetch REST”.
 * <p>
 * A future version may add fields (for example {@code type}, {@code reportId}, {@code productId}) so clients can
 * ignore events that do not concern the current view; those fields should be emitted only from write paths that
 * know the identifiers reliably.
 */
@RegisterForReflection
public record ReportSseMessage() {
}
