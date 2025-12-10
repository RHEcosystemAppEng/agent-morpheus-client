/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FailedComponent } from './FailedComponent';
import type { Justification } from './Justification';
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
         * Map of component analysis states to their counts
         */
        componentStates: Record<string, number>;
        /**
         * Map of CVE vulnerabilities and their justifications
         */
        cves: Record<string, Array<Justification>>;
        /**
         * Map of CVE justification status to count of components with that status
         */
        cveStatusCounts: Record<string, number>;
    };
};

