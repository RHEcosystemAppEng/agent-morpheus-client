/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Source code information
 */
export type SourceInfo = {
    /**
     * Type of source code (code|doc)
     */
    type: string;
    /**
     * Git repository URL
     */
    git_repo: string;
    /**
     * Git reference (commit hash, tag, or branch)
     */
    ref: string;
    /**
     * Patterns to include in the analysis
     */
    include: Array<string>;
    /**
     * Patterns to exclude from the analysis
     */
    exclude: Array<string>;
};

