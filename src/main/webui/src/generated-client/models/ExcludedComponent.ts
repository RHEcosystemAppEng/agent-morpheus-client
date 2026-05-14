/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Component excluded from or not completing full repository analysis
 */
export type ExcludedComponent = {
    /**
     * Component name
     */
    name: string;
    /**
     * Component version
     */
    version: string;
    /**
     * Component image or purl
     */
    image: string;
    /**
     * Detail when exclusionType is error; omit or null when dependency_not_present
     */
    error?: string | null;
    /**
     * Outcome classification
     */
    exclusionType: 'error' | 'dependency_not_present';
};

