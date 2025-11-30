/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SourceInfo } from './SourceInfo';
/**
 * A single report request
 */
export type ReportRequest = {
    /**
     * ID assigned on scan request submission (auto-generated if not provided)
     */
    id?: string;
    /**
     * Analysis form type (image|source)
     */
    analysisType: string;
    /**
     * List of vulnerability IDs to analyze
     */
    vulnerabilities: Array<string>;
    /**
     * Image data (required if SBOM is not provided)
     */
    image?: {
        /**
         * Analysis form type (image|source)
         */
        analysis_type: string;
        /**
         * Programming language ecosystem
         */
        ecosystem?: string;
        /**
         * Manifest file path
         */
        manifest_path?: string;
        /**
         * Image name
         */
        name: string;
        /**
         * Image tag
         */
        tag: string;
        /**
         * Source code information
         */
        source_info: Array<SourceInfo>;
        /**
         * SBOM information
         */
        sbom_info?: Record<string, any>;
    };
    /**
     * SBOM data (required if image is not provided)
     */
    sbom?: Record<string, any>;
    /**
     * SBOM information type
     */
    sbom_info_type?: 'manual' | 'cyclonedx+json';
    /**
     * Request metadata
     */
    metadata: Record<string, string>;
    /**
     * Source code repository (required if SBOM is not provided)
     */
    sourceRepo?: string;
    /**
     * Commit ID (required if SBOM is not provided)
     */
    commitId?: string;
    /**
     * Programming language ecosystem
     */
    ecosystem?: string;
    /**
     * Manifest file path
     */
    manifestPath?: string;
};

