/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User provided comments on a vulnerability
 */
export type UserComments = {
    /**
     * CVE ID
     */
    cve_id: string;
    /**
     * CVE Description
     */
    nvd_cve_description?: string;
    /**
     * CVSS Vector string
     */
    nvd_cvss_vector?: string;
    /**
     * CWE Name
     */
    nvd_cwe_name?: string;
    /**
     * GHSA Details
     */
    ghsa_vulnerabilities?: Array<Record<string, any>>;
    /**
     * Known Affected Software
     */
    nvd_configurations?: Array<Record<string, any>>;
    /**
     * CWE Description
     */
    nvd_cwe_description?: string;
    /**
     * CWE Extended Description
     */
    nvd_cwe_extended_description?: string;
    /**
     * Notable Vulnerable Software Vendors
     */
    nvd_vendor_names?: Array<string>;
    /**
     * RHSA Description
     */
    rhsa_bugzilla_description?: string;
    /**
     * RHSA Details
     */
    rhsa_details?: Array<string>;
    /**
     * RHSA Affected Packages
     */
    rhsa_package_state?: Array<Record<string, string>>;
    /**
     * RHSA Statement
     */
    rhsa_statement?: string;
    /**
     * Ubuntu Description
     */
    ubuntu_ubuntu_description?: string;
    /**
     * Identified Vulnerable Dependencies
     */
    vulnerable_dependencies?: string;
};

