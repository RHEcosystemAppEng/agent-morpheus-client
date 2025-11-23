package com.redhat.ecosystemappeng.morpheus.rest;

import com.redhat.ecosystemappeng.morpheus.model.FeedbackDto;
import com.redhat.ecosystemappeng.morpheus.service.FeedbackService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.ExampleObject;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;

@Path("/feedback")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class FeedbackResource {
    private static final Logger LOGGER = Logger.getLogger(FeedbackResource.class);

    @Inject
    FeedbackService feedbackService;
    
    @POST
    @Operation(
      summary = "Submit user feedback for an AI response", 
      description = "Submits user feedback for an AI response to the feedback service")
    @APIResponses({
      @APIResponse(
        responseCode = "200", 
        description = "Feedback successfully processed",
        content = @Content(
          examples = @ExampleObject(
            name = "Success Response",
            value = """
            {
              "status": "success"
            }
            """
          )
        )
      ),
      @APIResponse(
        responseCode = "500", 
        description = "Internal server error"
      )
    })
    public Response forwardToUserFeedbackService(
      @RequestBody(
        description = "User feedback data",
        required = true,
        content = @Content(schema = @Schema(implementation = FeedbackDto.class))
      )
      FeedbackDto dto) {
        LOGGER.infof(
                "Received FeedbackDto → response=[%s], rating=[%d], comment=[%s], accuracy=[%s], reasoning=[%s], checklist=[%s]",
                dto.getResponse(),
                dto.getRating(),
                dto.getComment(),
                dto.getAccuracy(),
                dto.getReasoning(),
                dto.getChecklist()
        );
        try {
            feedbackService.sendFeedback(dto);
            return Response.ok("{\"status\":\"success\"}").build();
        } catch (Exception e) {
            LOGGER.error("Failed to forward feedback to Flask:", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"status\":\"error\",\"message\":\"Failed to submit feedback.\"}")
                    .build();
        }
    }
    
    /**
     * Checks if feedback already exists for a specific report ID by calling the Flask API.
     */
    @GET
    @Path("/{reportId}/exists")
    @Operation(
      summary = "Check if feedback exists for a report", 
      description = "Checks if feedback has been submitted for a specific report")
    @APIResponses({
      @APIResponse(
        responseCode = "200", 
        description = "Feedback existence status retrieved successfully",
        content = @Content(
          examples = {
            @ExampleObject(
              name = "Feedback exists",
              value = """
              {
                "exists": true
              }
              """
            ),
            @ExampleObject(
              name = "Feedback does not exist",
              value = """
              {
                "exists": false
              }
              """
            )
          }
        )
      ),
      @APIResponse(
        responseCode = "500", 
        description = "Internal server error"
      )
    })
    public Response checkFeedbackExists(
      @Parameter(
        description = "Report identifier", 
        required = true
      )
      @PathParam("reportId") String reportId) {
        LOGGER.infof("Checking if feedback exists for reportId: %s", reportId);
        try {
            boolean exists = feedbackService.checkFeedbackExists(reportId);
            return Response.ok("{\"exists\":" + exists + "}").build();
        } catch (Exception e) {
            LOGGER.error("Failed to check feedback existence via Flask:", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"status\":\"error\",\"message\":\"Failed to check feedback status.\"}")
                    .build();
        }
    }

}