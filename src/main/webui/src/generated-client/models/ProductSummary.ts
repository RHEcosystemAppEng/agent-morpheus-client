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
         * Timestamp of product scan request submission
         */
        submittedAt: string;
        /**
         * Number of components submitted for scanning
         */
        submittedCount: number;
        /**
         * Product user provided metadata
         */
        metadata: Record<string, string>;
        /**
         * List of submitted components failed to be processed for scanning
         */
        submissionFailures: Array<FailedComponent>;
        /**
         * Timestamp of product scan request completion
         */
        completedAt?: string;
        /**
         * CVE ID associated with this product
         */
        cveId: string;
    };
    /**
     * Product reports summary data
     */
    summary: {
        /**
         * Product state of analysis
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

