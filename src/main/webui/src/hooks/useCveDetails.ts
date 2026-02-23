import { useMemo } from "react";
import { usePaginatedApi } from "./usePaginatedApi";
import { useApi } from "./useApi";
import { getRepositoryReport } from "../utils/reportApi";
import type { FullReport } from "../types/FullReport";
import type { Report } from "../generated-client/models/Report";
import type { ReportWithStatus } from "../generated-client";

export interface VulnerablePackage {
  name: string;
  ecosystem: string;
  vulnerableVersionRange: string;
  firstPatchedVersion: string;
}

export interface CveMetadata {
  cvssScore?: number;
  epssPercentage?: number;
  cwe?: string;
  publishedAt?: string;
  updatedAt?: string;
  credits?: {
    login: string;
    htmlUrl: string;
  };
  references?: string[];
  vulnerablePackages?: VulnerablePackage[];
  description?: string;
  descriptionSource?: "nvd" | "ghsa";
}

export interface UseCveDetailsResult {
  metadata: CveMetadata | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Pure function to extract CVE metadata from FullReport info.intel structure
 */
export function extractCveMetadata(
  report: FullReport | null,
  cveId: string
): CveMetadata | null {
  if (!report?.info) {
    return null;
  }

  const info = report.info as {
    intel?: Array<{
      vuln_id?: string;
      nvd?: {
        cve_description?: string;
      };
      ghsa?: {
        cvss?: {
          score?: number;
        };
        cwes?: Array<{
          cwe_id?: string;
        }>;
        published_at?: string;
        updated_at?: string;
        credits?: Array<{
          user?: {
            login?: string;
            html_url?: string;
          };
        }>;
        references?: string[];
        vulnerabilities?: Array<{
          package?: {
            name?: string;
            ecosystem?: string;
          };
          vulnerable_version_range?: string;
          first_patched_version?: string;
        }>;
        description?: string;
      };
      epss?: {
        percentage?: number;
      };
    }>;
  };

  const intel = info.intel;
  if (!intel || !Array.isArray(intel) || intel.length === 0) {
    return null;
  }

  // Find the intel entry matching the CVE ID
  const intelEntry = intel.find((entry) => entry.vuln_id === cveId);
  if (!intelEntry?.ghsa) {
    return null;
  }

  const ghsa = intelEntry.ghsa;
  const metadata: CveMetadata = {};

  // Extract CVSS score
  if (ghsa.cvss?.score !== undefined) {
    metadata.cvssScore = ghsa.cvss.score;
  }

  // Extract EPSS percentage
  if (intelEntry.epss?.percentage !== undefined) {
    metadata.epssPercentage = intelEntry.epss.percentage;
  }

  // Extract CWE (first one)
  if (ghsa.cwes && ghsa.cwes.length > 0 && ghsa.cwes[0]?.cwe_id) {
    metadata.cwe = ghsa.cwes[0].cwe_id;
  }

  // Extract published date
  if (ghsa.published_at) {
    metadata.publishedAt = ghsa.published_at;
  }

  // Extract updated date
  if (ghsa.updated_at) {
    metadata.updatedAt = ghsa.updated_at;
  }

  // Extract credits (first one)
  if (ghsa.credits && ghsa.credits.length > 0) {
    const credit = ghsa.credits[0];
    if (credit && credit.user?.login && credit.user?.html_url) {
      metadata.credits = {
        login: credit.user.login,
        htmlUrl: credit.user.html_url,
      };
    }
  }

  // Extract references
  if (
    ghsa.references &&
    Array.isArray(ghsa.references) &&
    ghsa.references.length > 0
  ) {
    metadata.references = ghsa.references.filter(
      (ref): ref is string => typeof ref === "string" && ref.length > 0
    );
  }

  // Extract vulnerable packages
  if (
    ghsa.vulnerabilities &&
    Array.isArray(ghsa.vulnerabilities) &&
    ghsa.vulnerabilities.length > 0
  ) {
    metadata.vulnerablePackages = ghsa.vulnerabilities
      .filter((vuln) => vuln.package?.name && vuln.package?.ecosystem)
      .map((vuln) => ({
        name: vuln.package!.name!,
        ecosystem: vuln.package!.ecosystem!,
        vulnerableVersionRange: vuln.vulnerable_version_range || "",
        firstPatchedVersion: vuln.first_patched_version || "",
      }));
  }

  // Extract description with fallback: nvd.cve_description -> ghsa.description
  const nvdDescription = intelEntry.nvd?.cve_description;
  if (
    nvdDescription &&
    typeof nvdDescription === "string" &&
    nvdDescription.trim().length > 0
  ) {
    metadata.description = nvdDescription.trim();
    metadata.descriptionSource = "nvd";
  } else if (
    ghsa.description &&
    typeof ghsa.description === "string" &&
    ghsa.description.trim().length > 0
  ) {
    metadata.description = ghsa.description.trim();
    metadata.descriptionSource = "ghsa";
  }

  return metadata;
}

/**
 * Hook to fetch CVE metadata from reports filtered by CVE ID
 * Fetches reports filtered by vulnId, then gets the full report data from the first result
 *
 * @param cveId - The CVE ID to fetch metadata for
 * @returns Object with metadata, loading, and error states
 */
export function useCveDetails(cveId: string): UseCveDetailsResult {
  // Step 1: Fetch reports filtered by CVE ID to get report IDs
  const {
    data: reports,
    loading: reportsLoading,
    error: reportsError,
  } = usePaginatedApi<Array<Report>>(
    () => ({
      method: "GET" as const,
      url: "/api/v1/reports",
      query: {
        page: 0,
        pageSize: 1, // We only need the first report
        vulnId: cveId,
      },
    }),
    {
      deps: [cveId],
    }
  );

  // Get the first report ID
  const firstReportId = useMemo(() => {
    if (!reports || reports.length === 0) {
      return null;
    }
    return reports[0]?.id || null;
  }, [reports]);

  // Step 2: Fetch the full report data using the first report ID
  // Only fetch if we have a report ID
  const {
    data: reportWithStatus,
    loading: fullReportLoading,
    error: fullReportError,
  } = useApi<ReportWithStatus | null>(
    () => {
      if (!firstReportId) {
        // Return a resolved promise with null if no report ID
        // This is a valid state (CVE not found in any reports)
        return Promise.resolve(null);
      }
      return getRepositoryReport(firstReportId);
    },
    {
      deps: [firstReportId],
    }
  );

  const fullReport = useMemo(() => {
    return reportWithStatus?.report || null;
  }, [reportWithStatus]);

  // Extract metadata from the full report
  const metadata = useMemo(() => {
    return extractCveMetadata(fullReport, cveId);
  }, [fullReport, cveId]);

  return {
    metadata,
    loading: reportsLoading || fullReportLoading,
    error: reportsError || fullReportError,
  };
}
