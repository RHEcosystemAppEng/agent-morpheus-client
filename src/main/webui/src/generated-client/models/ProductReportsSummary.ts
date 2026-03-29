/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Product reports data
 */
export type ProductReportsSummary = {
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

