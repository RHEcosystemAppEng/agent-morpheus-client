package com.redhat.ecosystemappeng.morpheus.tracing;

import io.opentelemetry.context.Context;
import io.opentelemetry.context.ContextKey;
import io.opentelemetry.context.propagation.TextMapGetter;
import io.opentelemetry.context.propagation.TextMapPropagator;
import io.opentelemetry.context.propagation.TextMapSetter;
import io.quarkus.opentelemetry.runtime.propagation.TextMapPropagatorCustomizer;
import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import io.opentelemetry.context.Context;
import jakarta.inject.Inject;

import java.util.Collection;
import java.util.List;

@Startup
@ApplicationScoped
public class TracingFieldsCustomizer implements TextMapPropagatorCustomizer {

    public static final String TRACE_ID = "traceId";
    public static ContextKey<String> getTraceIdContextKey() {
        return TextMapPropagatorImpl.TRACE_ID_CONTEXT_KEY;
    }
    @Override
    public TextMapPropagator customize(Context context) {
        return new TextMapPropagatorImpl();
        };

}

