package com.redhat.ecosystemappeng.morpheus.tracing;

import io.opentelemetry.context.Context;
import io.opentelemetry.context.ContextKey;
import io.opentelemetry.context.propagation.TextMapGetter;
import io.opentelemetry.context.propagation.TextMapPropagator;
import io.opentelemetry.context.propagation.TextMapSetter;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logmanager.MDC;

import java.util.Collection;
import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.redhat.ecosystemappeng.morpheus.tracing.TracingFieldsCustomizer.TRACE_ID;


public class TextMapPropagatorImpl implements TextMapPropagator {

    public static final ContextKey<String> TRACE_ID_CONTEXT_KEY = ContextKey.named(TRACE_ID);

    @Override
    public Collection<String> fields() {
        return Collections.singletonList(TRACE_ID);
    }

    @Override
    public <C> void inject(Context context, C carrier, TextMapSetter<C> setter) {
        String traceId = context.get(TRACE_ID_CONTEXT_KEY);
        if (traceId == null) {
            traceId = getTraceIdFromContext(context);
        }
        setter.set(carrier, TRACE_ID, traceId);
    }

    public static String getTraceIdFromContext(Context context) {
        String traceId=null;
        String tracingContextString = context.toString();
        final String regex = "traceId\\s*=\\s*[a-f0-9]+";
        final Pattern pattern = Pattern.compile(regex, Pattern.MULTILINE);
        final Matcher matcher = pattern.matcher(tracingContextString);

        while (matcher.find()) {
            String[] split = matcher.group(0).split("=");
            String key = split[0];
            String traceIdValue = split[1];
            if (traceIdValue != null && !traceIdValue.matches("0+") ) {
                traceId = traceIdValue;
                break;
            }
        }
        return traceId;
    }

    @Override
    public <C> Context extract(Context context, C carrier, TextMapGetter<C> getter) {
        String traceId = getter.get(carrier, TRACE_ID);
        // Logs should be with same traceId As request
        if (traceId != null) {
            MDC.put(TRACE_ID,traceId);
            return context.with(TRACE_ID_CONTEXT_KEY, traceId);
        }
        else{
            return context;
        }


    }
}
