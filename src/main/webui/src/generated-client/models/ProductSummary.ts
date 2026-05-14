/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExcludedComponent } from './ExcludedComponent';
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
         * Components excluded from full analysis or without a completed repository report
         */
        excludedComponents: Array<ExcludedComponent>;
        /**
         * Timestamp of product scan request completion
         */
        completedAt?: string;
        /**
         * When true, Exhort dependency triage was unavailable at SPDX whole-product startup; CVE-in-tree filtering was skipped and full analysis ran for reachable components.
         */
        dependencyTriageUnavailable?: boolean;
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
        /**
         * Scan id for direct navigation to the single-component report view (/reports/component/:cveId/:scanId). Populated when metadata spdx_id is absent or blank, submittedCount is 1, exactly one report document exists for the product, and that report has a non-empty input.scan.id.
         */
        singleComponentFlowScanId?: string;
    };
};

