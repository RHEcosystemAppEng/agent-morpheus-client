/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExcludedComponent } from './ExcludedComponent';
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

