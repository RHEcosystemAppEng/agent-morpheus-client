package com.redhat.ecosystemappeng.morpheus.rest;

import com.redhat.ecosystemappeng.morpheus.model.FeedbackDto;
import com.redhat.ecosystemappeng.morpheus.service.FeedbackService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

@Path("/feedback")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class FeedbackResource {
    private static final Logger LOGGER = Logger.getLogger(FeedbackResource.class);

    @Inject
    FeedbackService feedbackService;
    @POST
    public Response forwardToUserFeedbackService(FeedbackDto dto) {
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
    public Response checkFeedbackExists(@PathParam("reportId") String reportId) {
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
