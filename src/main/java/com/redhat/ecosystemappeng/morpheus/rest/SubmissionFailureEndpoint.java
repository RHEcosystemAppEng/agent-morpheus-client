package com.redhat.ecosystemappeng.morpheus.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.FailedComponent;
import com.redhat.ecosystemappeng.morpheus.service.SubmissionFailureService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

import org.jboss.logging.Logger;

@Path("/submission-failures")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class SubmissionFailureEndpoint {
  
  private static final Logger LOGGER = Logger.getLogger(SubmissionFailureEndpoint.class);

  @Inject
  SubmissionFailureService submissionFailureService;

  @Inject
  ObjectMapper objectMapper;

  @POST
  public Response save(List<FailedComponent> request) {
    try {
      submissionFailureService.save(request);
      
      return Response.accepted().build();
    } catch (Exception e) {
      LOGGER.error("Failed to save failed components to database", e);
      return Response.serverError().entity(objectMapper.createObjectNode().put("error", e.getMessage())).build();
    }
  }

  @GET
  @Path("/{id}")
  public Response get(String id) {
    return Response.ok(submissionFailureService.get(id)).build();
  }
  
  @DELETE
  public Response delete(String productId) {
    submissionFailureService.remove(productId);
    return Response.accepted().build();
  }
}