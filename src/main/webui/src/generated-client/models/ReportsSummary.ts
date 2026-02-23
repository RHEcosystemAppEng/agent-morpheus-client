/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Summary of reports statistics
 */
export type ReportsSummary = {
    /**
     * Count of reports containing vulnerable CVEs
     */
    vulnerableReportsCount: number;
    /**
     * Count of reports containing only non-vulnerable CVEs
     */
    nonVulnerableReportsCount: number;
    /**
     * Count of pending analysis requests
     */
    pendingRequestsCount: number;
    /**
     * Count of new reports submitted today
     */
    newReportsTodayCount: number;
};

