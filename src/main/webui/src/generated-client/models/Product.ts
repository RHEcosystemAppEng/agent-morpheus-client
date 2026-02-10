/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FailedComponent } from './FailedComponent';
/**
 * Product metadata
 */
export type Product = {
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

