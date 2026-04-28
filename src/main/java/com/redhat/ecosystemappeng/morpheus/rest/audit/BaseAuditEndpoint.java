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

package com.redhat.ecosystemappeng.morpheus.rest.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestResponse;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;
import jakarta.validation.ValidationException;
import org.jboss.resteasy.reactive.server.UnwrapException;
import org.jboss.resteasy.reactive.server.jaxrs.RestResponseBuilderImpl;


@UnwrapException({RuntimeException.class})
public class BaseAuditEndpoint {

    private static final Logger LOGGER = Logger.getLogger(BaseAuditEndpoint.class);
    public static final int UNPROCESSABLE_ENTITY_HTTP_ERROR = 422;

    @ServerExceptionMapper

  public RestResponse<String> mapValidation(ValidationException ex) {
      LOGGER.error("Input validation of request failed, details => " , ex);
      return RestResponseBuilderImpl.create(RestResponse.Status.BAD_REQUEST,"Input validation error on request body/query parameters/path params, details:"  + ex.getMessage()).type(MediaType.TEXT_PLAIN).build();
//      status(Response.Status.BAD_REQUEST, ");
   }

  @ServerExceptionMapper
  public RestResponse<String> mapIllegalArgument(IllegalArgumentException ex) {
      LOGGER.error("Input validation of request failed, details => ", ex);
      return RestResponseBuilderImpl.create(Response.Status.BAD_REQUEST, "Input validation error on query parameters, details: " + ex.getMessage()).type(MediaType.TEXT_PLAIN).build();
   }


  @ServerExceptionMapper
  public RestResponse<String> mapNotFound(NotFoundException ex) {
      LOGGER.error("Resource not found, details => ", ex);
      return RestResponseBuilderImpl.create(Response.Status.NOT_FOUND,
                                            "resource not found, details=> " + ex.getMessage()).type(MediaType.TEXT_PLAIN).build();
   }



  @ServerExceptionMapper
  public RestResponse<String> mapJsonProcessingException(JsonProcessingException ex) {
      LOGGER.error("error encountered for serializing json, details of error:", ex);
      return RestResponseBuilderImpl.create(Response.Status.INTERNAL_SERVER_ERROR,
                                            "General Error encountered, Contact admin").type(MediaType.TEXT_PLAIN).build();
   }

    @ServerExceptionMapper
    public Response mapUnprocessableEntity(WebApplicationException ex) {
        LOGGER.error("Cannot insert list of resources because reference key is not in DB details => ", ex);
        if(ex.getResponse().getStatusInfo().getStatusCode() == UNPROCESSABLE_ENTITY_HTTP_ERROR) {
            return Response.status(UNPROCESSABLE_ENTITY_HTTP_ERROR).entity("Referenced resource not found, thus cannot insert documents to DB, details=> " + ex.getMessage()).type(MediaType.TEXT_PLAIN).build();

        }
        else {
            try (RestResponse<String> stringRestResponse = mapGeneralException(ex)) {
                return stringRestResponse.toResponse();
            }

        }
    }

  @ServerExceptionMapper
  public RestResponse<String> mapGeneralException(Exception ex) {
      LOGGER.error("General unexpected error encountered during API request, details:",  ex);

      return RestResponseBuilderImpl.create(RestResponse.Status.INTERNAL_SERVER_ERROR,"Unexpected General Error encountered, Contact admin").type(MediaType.TEXT_PLAIN).build();
   }


}
