/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VulnResult } from './VulnResult.js';
/**
 * Report metadata
 */
export type Report = {
    /**
     * Report ID (MongoDB ObjectId hex)
     */
    id: string;
    /**
     * Scan ID (input.scan.id), use for URLs and get-by-scan-id API
     */
    scanId: string;
    /**
     * Started at timestamp for report analysis
     */
    startedAt: string;
    /**
     * Completed at timestamp for report analysis
     */
    completedAt: string;
    /**
     * Image name
     */
    imageName: string;
    /**
     * Image tag
     */
    imageTag: string;
    /**
     * State of the report analysis
     */
    state: string;
    /**
     * Vulnerabilities in the report and their analysis results
     */
    vulns: Array<VulnResult>;
    /**
     * User provided metadata for the report
     */
    metadata: Record<string, string>;
    /**
     * Git repository URL from source_info
     */
    gitRepo?: string;
    /**
     * Git reference (commit hash, tag, or branch) from source_info
     */
    ref?: string;
    /**
     * Submitted at timestamp from metadata.submitted_at
     */
    submittedAt?: string;
};

