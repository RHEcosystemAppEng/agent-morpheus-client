/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PipelineMode } from './PipelineMode';
import type { SourceInfo } from './SourceInfo';
import type { TargetPackage } from './TargetPackage';
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
    /**
     * Agent pipeline mode; omit when not applicable
     */
    pipeline_mode?: PipelineMode;
    /**
     * RPM target package when pipeline_mode is rpm_package_checker
     */
    target_package?: TargetPackage;
};

