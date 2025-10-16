package com.redhat.ecosystemappeng.morpheus.client;

import com.redhat.ecosystemappeng.morpheus.model.FeedbackDto;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/api/feedback") // Flask route
@RegisterRestClient(configKey = "feedback-api")
public interface FeedbackApi {

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    void sendFeedback(FeedbackDto dto);

    @GET
    @Path("/{reportId}/exists")
    @Produces(MediaType.APPLICATION_JSON)
    Response checkFeedbackExists(@PathParam("reportId") String reportId);
}