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

package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@RegisterForReflection
@Schema(name = "Feedback", description = "Data Transfer Object for submitting user feedback about a specific report.")
public class FeedbackDto {
    @Schema(required = true, description = "The response feedback")
    private String response; 
    @Schema(required = true, description = "Rating value from 1 to 5", minimum = "1", maximum = "5")
    private Integer rating;
    @Schema(description = "Additional comment or feedback text")
    private String comment;
    @Schema(required = true, description = "Unique identifier of the report")
    private String reportId;
    @Schema(required = true, description = "Accuracy assessment of the report")
    private String accuracy; 
    @Schema(required = true, description = "Reasoning or explanation of the report")
    private String reasoning;
    @Schema(required = true, description = "Checklist assessment of the report")
    private String checklist;

    public java.lang.Object getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getReportId() {
        return reportId;
    }
    public void setReportId(String reportId) {
        this.reportId = reportId;
    }
    public String getAccuracy() {
        return accuracy;
    }
    public void setAccuracy(String accuracy) {
        this.accuracy = accuracy;
    }
    public String getReasoning() {
        return reasoning;
    }
    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
    public String getChecklist() {
        return checklist;
    }
    public void setChecklist(String checklist) {
        this.checklist = checklist;
    }
}

