/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * SBOM report data grouped by sbom_report_id
 */
export type SbomReport = {
    /**
     * SBOM name from first report's metadata.sbom_name
     */
    sbomName?: string;
    /**
     * SBOM report ID from first report's metadata.sbom_report_id
     */
    sbomReportId: string;
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
     * Number of reports in this SBOM report group
     */
    numReports: number;
    /**
     * MongoDB document _id (as hex string) of the first report in the group, always populated for navigation purposes
     */
    firstReportId?: string;
};

