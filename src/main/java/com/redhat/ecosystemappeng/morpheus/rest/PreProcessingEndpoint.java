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

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.service.PreProcessingService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.jboss.logging.Logger;

@SecurityRequirement(name = "jwt")
@Path("/pre-processing")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PreProcessingEndpoint {
  
  private static final Logger LOGGER = Logger.getLogger(PreProcessingEndpoint.class);

  @Inject
  PreProcessingService preProcessingService;

  @Inject
  ObjectMapper objectMapper;

  @POST
  @Operation(
    summary = "Submit report requests for pre-processing", 
    description = "Submits a list of report requests for pre-processing to the Component Syncer")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Pre-processing request accepted by the Component Syncer"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response submit(
    @RequestBody(
      description = "List of report requests for pre-processing",
      required = true,
      content = @Content(schema = @Schema(type = SchemaType.ARRAY, implementation = ReportData.class))
    )
    List<ReportData> payloads) {
    try {
      JsonNode parsedPayloads = preProcessingService.parse(payloads);
      List<String> ids = preProcessingService.getIds(payloads);
      Response res = preProcessingService.submit(parsedPayloads, ids);
      
      int status = res.getStatus();
      if (status >= Response.Status.MULTIPLE_CHOICES.getStatusCode()) {
        String errorBody = res.readEntity(String.class);
        String errorMessage = String.format("Component Syncer failed with status code: %s, error: %s", status, errorBody);
        for (String id : ids) {
          preProcessingService.handleError(id, "component-syncer-request-error", errorMessage);
        }
      }

      return res;
    } catch (Exception e) {
      LOGGER.error("Failed to submit payloads for pre-processing", e);
      return Response.status(Status.INTERNAL_SERVER_ERROR)
                .entity(objectMapper.createObjectNode()
                .put("error", e.getMessage()))
                .build();
    }
  }
}
