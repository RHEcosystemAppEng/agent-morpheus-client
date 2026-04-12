/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Report data with calculated analysis status
 */
export type ReportWithStatus = {
    /**
     * Full report data from MongoDB
     */
    report: Record<string, any>;
    /**
     * Calculated analysis status of the report (completed, queued, sent, expired, failed, pending, unknown)
     */
    status: string;
};

