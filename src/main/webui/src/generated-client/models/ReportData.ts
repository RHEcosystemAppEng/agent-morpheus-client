/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A single report request
 */
export type ReportData = {
    /**
     * Report identification
     */
    reportRequestId: {
        /**
         * ID assigned for database identification
         */
        id: string;
        /**
         * ID assigned on scan request submission
         */
        reportId: string;
    };
    /**
     * Report payload
     */
    report: Record<string, any>;
};

