/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Summary of reports data for a product
 */
export type ProductReportsSummary = {
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

