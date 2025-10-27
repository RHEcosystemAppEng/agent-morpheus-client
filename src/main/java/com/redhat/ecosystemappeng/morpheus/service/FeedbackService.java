package com.redhat.ecosystemappeng.morpheus.service;

import com.redhat.ecosystemappeng.morpheus.client.FeedbackApi;
import com.redhat.ecosystemappeng.morpheus.model.FeedbackDto;
import com.redhat.ecosystemappeng.morpheus.rest.ReportEndpoint;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

@ApplicationScoped
public class FeedbackService {
    private static final Logger LOGGER = Logger.getLogger(FeedbackService.class);
    @Inject
    @RestClient
    FeedbackApi feedbackApi;

    public void sendFeedback(FeedbackDto dto) {
        LOGGER.debugf("FeedbackService DTO", dto.getComment());
        feedbackApi.sendFeedback(dto);
    }

    public boolean checkFeedbackExists(String reportId) {
        LOGGER.debugf("Checking if feedback exists for reportId: %s", reportId);
        try {
            Response response = feedbackApi.checkFeedbackExists(reportId);
            if (response.getStatus() == Response.Status.OK.getStatusCode()) {
                JsonObject json = response.readEntity(JsonObject.class);
                boolean exists = json.getBoolean("exists", false);
                LOGGER.debugf("Feedback exists for reportId %s: %s", reportId, exists);
                return exists;
            }
        } catch (Exception e) {
            LOGGER.errorf("Failed to check if feedback exists for reportId %s: %s", reportId, e.getMessage());
        }
        return false;
    }


}


