/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * RPM package plus CVE for new analysis request
 */
export type NewRpmReportRequest = {
    /**
     * RPM package name
     */
    name: string;
    /**
     * RPM package version
     */
    version: string;
    /**
     * RPM package release
     */
    release: string;
    /**
     * RPM architecture
     */
    arch: string;
    /**
     * Vulnerability identifier (CVE-YYYY-NNNN+)
     */
    cveId: string;
};

