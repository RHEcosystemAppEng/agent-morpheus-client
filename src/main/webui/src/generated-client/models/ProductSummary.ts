/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FailedComponent } from './FailedComponent';
/**
 * Product metadata and reports data
 */
export type ProductSummary = {
    /**
     * Product data
     */
    data: {
        /**
         * Product ID
         */
        id: string;
        /**
         * Product name
         */
        name: string;
        /**
         * Product version
         */
        version: string;
        /**
         * Submitted at timestamp
         */
        submittedAt?: string;
        /**
         * Submitted count
         */
        submittedCount?: number;
        /**
         * CVE ID associated with this product
         */
        cveId?: string;
        /**
         * User provided metadata for the product
         */
        metadata?: Record<string, string>;
        /**
         * Submission failures
         */
        submissionFailures?: Array<FailedComponent>;
        /**
         * Completed at timestamp
         */
        completedAt?: string;
    };
    /**
     * Product reports summary data
     */
    summary: {
        /**
         * Product state: 'analysing' or 'completed'
         */
        productState: string;
        /**
         * Map of analysis state to count of reports with that state
         */
        statusCounts: Record<string, number>;
        /**
         * Map of justification status to count of reports with that status
         */
        justificationStatusCounts: Record<string, number>;
    };
};

