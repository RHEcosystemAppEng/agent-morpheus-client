package com.redhat.ecosystemappeng.morpheus.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.service.PreProcessingService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

import org.jboss.logging.Logger;

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
  public Response submit(List<ReportData> payloads) {
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
      return Response.serverError().entity(objectMapper.createObjectNode().put("error", e.getMessage())).build();
    }
  }
}