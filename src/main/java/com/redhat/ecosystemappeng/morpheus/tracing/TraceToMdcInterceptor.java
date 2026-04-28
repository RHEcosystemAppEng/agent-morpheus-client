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
