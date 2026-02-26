/**
 * TypeScript type definitions for Intel structure in FullReport
 * This provides type safety for the info.intel array structure
 */

/**
 * GHSA (GitHub Security Advisory) data structure
 */
export interface Ghsa {
  /** CVSS score information */
  cvss?: {
    score?: number;
  };
  /** CWE (Common Weakness Enumeration) identifiers */
  cwes?: Array<{
    cwe_id?: string;
  }>;
  /** Published date */
  published_at?: string;
  /** Updated date */
  updated_at?: string;
  /** Credits information */
  credits?: Array<{
    user?: {
      login?: string;
      html_url?: string;
    };
  }>;
  /** Reference URLs */
  references?: string[];
  /** Vulnerable packages information */
  vulnerabilities?: Array<{
    package?: {
      name?: string;
      ecosystem?: string;
    };
    vulnerable_version_range?: string;
    first_patched_version?: string;
  }>;
  /** Description text (may contain markdown) */
  description?: string;
}

/**
 * NVD (National Vulnerability Database) data structure
 */
export interface Nvd {
  /** CVE description */
  cve_description?: string;
}

/**
 * EPSS (Exploit Prediction Scoring System) data structure
 */
export interface Epss {
  /** EPSS percentage (0-1 range) */
  percentage?: number;
}

/**
 * Single Intel entry in the intel array
 */
export interface IntelEntry {
  /** Vulnerability ID (CVE ID) */
  vuln_id?: string;
  /** NVD data */
  nvd?: Nvd;
  /** GHSA data */
  ghsa?: Ghsa;
  /** EPSS data */
  epss?: Epss;
}

/**
 * Intel structure containing array of intel entries
 */
export interface Intel {
  /** Array of intel entries */
  intel?: IntelEntry[];
}
