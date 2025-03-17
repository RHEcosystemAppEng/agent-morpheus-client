package com.redhat.ecosystemappeng.morpheus.tracing;

import io.opentelemetry.context.Context;
import jakarta.annotation.Priority;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import org.jboss.logmanager.MDC;
import static com.redhat.ecosystemappeng.morpheus.tracing.TracingFieldsCustomizer.TRACE_ID;

@TraceToMdc
@Priority(100)
@Interceptor
public class TraceToMdcInterceptor {
    @AroundInvoke
    Object propagateTraceToMdc(InvocationContext context) throws Exception {
        String traceIdFromContext = TextMapPropagatorImpl.getTraceIdFromContext(Context.current());
        MDC.put(TRACE_ID, traceIdFromContext);
        Object ret = context.proceed();
        return ret;
    }


}
