/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SourceInfo } from './SourceInfo';
/**
 * Image data (required if SBOM is not provided)
 */
export type Image = {
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

