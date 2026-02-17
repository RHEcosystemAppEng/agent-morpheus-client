/**
 * TypeScript type definitions for FullReport
 * These types provide detailed structure and autocomplete for the report data
 * that comes from MongoDB as raw JSON.
 */

/**
 * A single checklist item in the vulnerability analysis
 */
export interface ChecklistItem {
  /** Checklist item input/question */
  input?: string;
  /** Response to the checklist item */
  response?: string;
  /** Intermediate steps taken during analysis */
  intermediate_steps?: string | null;
}

/**
 * Analysis justification for a vulnerability
 */
export interface Justification {
  /** Justification status (true|false|unknown) */
  status: string;
  /** Justification label */
  label: string;
  /** Reason for the justification (optional, may be present in JSON) */
  reason?: string;
}

/**
 * CVSS score information
 */
export interface Cvss {
  /** CVSS score as string (e.g., "8.7") */
  score: string;
  /** CVSS vector string (e.g., "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:N") */
  vector_string: string;
}

/**
 * Vulnerability analysis output for a single CVE
 */
export interface ReportOutput {
  /** Vulnerability ID (CVE ID) */
  vuln_id?: string;
  /** Checklist items used in the analysis */
  checklist?: ChecklistItem[];
  /** Summary of the analysis */
  summary?: string;
  /** Justification for the vulnerability analysis result */
  justification?: Justification;
  /** Intel score for the vulnerability */
  intel_score?: number | null;
  /** CVSS score information for the vulnerability */
  cvss?: Cvss | null;
}

/**
 * Image data in FullReport context (with optional name and tag)
 */
export interface FullReportImage {
  /** Analysis form type (image|source) */
  analysis_type: string;
  /** Programming language ecosystem */
  ecosystem?: string;
  /** Manifest file path */
  manifest_path?: string;
  /** Image name (optional in FullReport context) */
  name?: string;
  /** Image tag (optional in FullReport context) */
  tag?: string;
  /** Source code information */
  source_info: Array<{
    type?: string;
    git_repo?: string;
    ref?: string;
    include?: string[];
    exclude?: string[];
  }>;
  /** SBOM information */
  sbom_info?: Record<string, unknown>;
}

/**
 * Report input data in FullReport context
 */
export interface FullReportInput {
  /** Scan information */
  scan?: {
    id?: string;
    type?: string | null;
    started_at?: string;
    completed_at?: string;
    vulns?: Array<{
      vuln_id?: string;
      description?: string | null;
      score?: number | null;
      severity?: string | null;
      published_date?: string | null;
      last_modified_date?: string | null;
      url?: string | null;
      feed_group?: string | null;
      package?: string | null;
      package_version?: string | null;
      package_name?: string | null;
      package_type?: string | null;
    }>;
  };
  /** Image information (with optional name and tag) */
  image?: FullReportImage;
}

/**
 * Report output structure containing analysis results and VEX data
 */
export interface FullReportOutput {
  /** Array of vulnerability analysis results */
  analysis?: ReportOutput[];
  /** VEX (Vulnerability Exploitability eXchange) data */
  vex?: unknown | null;
}

/**
 * Complete analysis report with all fields from MongoDB
 * This type provides full type safety and autocomplete for report data
 */
export interface FullReport {
  /** Report ID (MongoDB ObjectId as hex string) */
  _id?: string;
  /** Report input data containing scan and image information */
  input?: FullReportInput;
  /** Report output data containing vulnerability analysis results and VEX */
  output?: FullReportOutput;
  /** Report information including VDB, intel, and SBOM data */
  info?: Record<string, unknown>;
  /** User provided metadata for the report */
  metadata?: Record<string, string>;
}

