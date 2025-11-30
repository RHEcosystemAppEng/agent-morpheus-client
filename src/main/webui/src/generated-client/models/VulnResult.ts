/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Vulnerability analysis information
 */
export type VulnResult = {
    /**
     * Vulnerability ID (CVE ID)
     */
    vulnId: string;
    /**
     * Analysis justification for the vulnerability
     */
    justification: {
        /**
         * Justification status (true|false|unknown)
         */
        status: string;
        /**
         * Justification label
         */
        label: string;
    };
};

