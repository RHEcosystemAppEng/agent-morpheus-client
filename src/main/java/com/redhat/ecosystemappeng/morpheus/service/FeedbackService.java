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

package com.redhat.ecosystemappeng.morpheus.service;

import com.redhat.ecosystemappeng.morpheus.client.FeedbackApi;
import com.redhat.ecosystemappeng.morpheus.model.FeedbackDto;
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


