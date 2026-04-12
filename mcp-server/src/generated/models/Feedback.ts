/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Data Transfer Object for submitting user feedback about a specific report.
 */
export type Feedback = {
    /**
     * The response feedback
     */
    response: string;
    /**
     * Rating value from 1 to 5
     */
    rating: number;
    /**
     * Additional comment or feedback text
     */
    comment?: string;
    /**
     * Unique identifier of the report
     */
    reportId: string;
    /**
     * Accuracy assessment of the report
     */
    accuracy: string;
    /**
     * Reasoning or explanation of the report
     */
    reasoning: string;
    /**
     * Checklist assessment of the report
     */
    checklist: string;
};

