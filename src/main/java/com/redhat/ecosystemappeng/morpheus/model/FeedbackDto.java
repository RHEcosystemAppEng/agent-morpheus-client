package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class FeedbackDto {
    private String response;
    private Integer rating;
    private String comment;
    private String reportId;
    private String accuracy;
    private String reasoning;
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

