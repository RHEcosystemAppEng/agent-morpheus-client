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
     * List of Component analysis states
     */
    componentStates: Array<string>;
    /**
     * Map of CVE vulnerabilities and their justifications
     */
    cves: Record<string, Array<Justification>>;
};

