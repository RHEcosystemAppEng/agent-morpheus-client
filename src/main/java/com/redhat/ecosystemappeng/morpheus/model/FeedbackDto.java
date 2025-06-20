package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class FeedbackDto {
    private String response;
    private String thumbs;
    private Integer rating;
    private String comment;
    private String reportId;
    private String assessment;
    private String reason;
    private String summary;
    private String qClarity;
    private String aAgreement;

    public java.lang.Object getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public String getThumbs() { return thumbs; }
    public void setThumbs(String thumbs) { this.thumbs = thumbs; }
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
    public String getAssessment() {
        return assessment;
    }
    public void setAssessment(String assessment) {
        this.assessment = assessment;
    }
    public String getReason() {
        return reason;
    }
    public void setReason(String reason) {
        this.reason = reason;
    }
    public String getSummary() {
        return summary;
    }
    public void setSummary(String summary) {
        this.summary = summary;
    }
    public String getqClarity() {
        return qClarity;
    }
    public void setqClarity(String qClarity) {
        this.qClarity = qClarity;
    }
    public String getaAgreement() {
        return aAgreement;
    }
    public void setaAgreement(String aAgreement) {
        this.aAgreement = aAgreement;
    }
}

