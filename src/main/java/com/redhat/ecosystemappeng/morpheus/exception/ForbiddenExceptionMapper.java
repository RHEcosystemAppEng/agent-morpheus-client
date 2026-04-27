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

package com.redhat.ecosystemappeng.morpheus.exception;

import io.quarkus.security.ForbiddenException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.io.InputStream;
import java.util.List;

/**
 * Maps ForbiddenException to a user-friendly HTML page or API error.
 *
 * Serves custom 403 page for browsers; standard 403 status for API clients.
 */
@Provider
public class ForbiddenExceptionMapper implements ExceptionMapper<ForbiddenException> {

    private static final Logger LOG = Logger.getLogger(ForbiddenExceptionMapper.class);

    @Context
    HttpHeaders headers;

    /**
     * Returns HTML or JSON error response based on Accept header.
     */
    @Override
    public Response toResponse(ForbiddenException exception) {
        if (isHtmlRequest()) {
            try (InputStream is = getClass().getResourceAsStream("/META-INF/resources/error/403.html")) {
                if (is != null) {
                    byte[] content = is.readAllBytes();
                    return Response.status(Response.Status.FORBIDDEN)
                            .entity(content)
                            .type(MediaType.TEXT_HTML)
                            .build();
                }
            } catch (Exception e) {
                LOG.error("Failed to load 403.html", e);
            }
        }

        return Response.status(Response.Status.FORBIDDEN).build();
    }

    private boolean isHtmlRequest() {
        if (headers == null)
            return false;
        List<MediaType> acceptableMediaTypes = headers.getAcceptableMediaTypes();
        for (MediaType mt : acceptableMediaTypes) {
            if (MediaType.TEXT_HTML_TYPE.isCompatible(mt)) {
                return true;
            }
        }
        return false;
    }
}
