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

import com.redhat.ecosystemappeng.morpheus.model.OverviewMetricsDTO;
import com.redhat.ecosystemappeng.morpheus.service.OverviewMetricsService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/overview-metrics")
@Tag(name = "Overview Metrics")
public class OverviewMetricsResource {

    @Inject
    OverviewMetricsService metricsService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
        summary = "Get overview metrics",
        description = "Retrieves metrics for the home page calculated from data in the last week, including count of successfully analyzed reports, average reliability score, and false positive rate"
    )
    @APIResponse(
        responseCode = "200",
        description = "Overview metrics retrieved successfully",
        content = @Content(
            mediaType = MediaType.APPLICATION_JSON,
            schema = @Schema(implementation = OverviewMetricsDTO.class)
        )
    )
    @APIResponse(
        responseCode = "500",
        description = "Internal server error"
    )
    public OverviewMetricsDTO getOverviewMetrics() {
        return metricsService.getMetrics();
    }
}