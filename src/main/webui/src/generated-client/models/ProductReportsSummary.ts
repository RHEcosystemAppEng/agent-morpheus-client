/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Justification } from './Justification';
/**
 * Product reports data
 */
export type ProductReportsSummary = {
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
     * Map of each CVE to its status counts (status -> count)
     */
    cveStatusCounts: Record<string, Record<string, number>>;
};

