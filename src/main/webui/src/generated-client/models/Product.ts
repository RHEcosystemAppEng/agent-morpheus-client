/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Product data grouped by product_id
 */
export type Product = {
    /**
     * SBOM name from first report's metadata.sbom_name
     */
    sbomName?: string;
    /**
     * Product ID from first report's metadata.product_id
     */
    productId: string;
    /**
     * CVE ID from first report's input.scan.vulns[0].vuln_id
     */
    cveId?: string;
    /**
     * Map of CVE status to count of reports with that status
     */
    cveStatusCounts: Record<string, number>;
    /**
     * Map of report status to count of reports with that status
     */
    statusCounts: Record<string, number>;
    /**
     * Completed at timestamp - empty if any report's completed_at is empty, otherwise latest value
     */
    completedAt?: string;
    /**
     * Submitted at timestamp from first report's metadata.submitted_at
     */
    submittedAt?: string;
    /**
     * Number of reports in this product group
     */
    numReports: number;
    /**
     * MongoDB document _id (as hex string) of the first report in the group, always populated for navigation purposes
     */
    firstReportId?: string;
};

