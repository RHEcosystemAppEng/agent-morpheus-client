import { useMemo } from "react";
import { useApi } from "./useApi";
import {
  ReportEndpointService as Reports,
  ProductSummary,
} from "../generated-client";
import { ReportsToolbarFilters } from "../components/ReportsToolbar";

export type ProductStatus = {
  status: "vulnerable" | "not_vulnerable" | "unknown";
  vulnerableCount: number;
  notVulnerableCount: number;
  uncertainCount: number;
  totalCount: number;
};

export interface ReportRow {
  reportId: string;
  sbomName: string;
  cveId: string;
  repositoriesAnalyzed: string;
  exploitIqStatus: string;
  exploitIqLabel: string;
  completedAt: string;
  analysisState: string;
  productStatus: ProductStatus;
}

export type SortDirection = "asc" | "desc";
export type SortColumn = "reportId" | "sbomName" | "completedAt";

export interface UseReportsTableOptions {
  searchValue: string;
  cveSearchValue: string;
  filters: ReportsToolbarFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

export interface UseReportsTableResult {
  rows: ReportRow[];
  loading: boolean;
  error: Error | null;
}

/**
 * Pure function to calculate CVE-level repository status counts from a product summary
 * Returns status counts for a specific CVE based on repository-level justifications
 */
export function calculateCveStatus(
  productSummary: ProductSummary,
  cveId: string
): ProductStatus {
  const cveStatusCounts = productSummary.summary.cveStatusCounts || {};
  const statusCounts = (cveStatusCounts[cveId] || {}) as Record<string, number>;

  // Take values directly from cveStatusCounts
  const vulnerableCount = statusCounts["TRUE"] || statusCounts["true"] || 0;
  const notVulnerableCount =
    statusCounts["FALSE"] || statusCounts["false"] || 0;
  const uncertainCount =
    statusCounts["UNKNOWN"] || statusCounts["unknown"] || 0;

  const totalCount = vulnerableCount + notVulnerableCount + uncertainCount;

  // Determine overall status
  if (vulnerableCount > 0) {
    return {
      status: "vulnerable",
      vulnerableCount,
      notVulnerableCount,
      uncertainCount,
      totalCount,
    };
  }

  // No vulnerable repositories
  if (notVulnerableCount > 0 || (totalCount > 0 && vulnerableCount === 0)) {
    return {
      status: "not_vulnerable",
      vulnerableCount: 0,
      notVulnerableCount,
      uncertainCount,
      totalCount,
    };
  }

  // Unknown status
  return {
    status: "unknown",
    vulnerableCount: 0,
    notVulnerableCount: 0,
    uncertainCount,
    totalCount,
  };
}

/**
 * Pure function to check if analysis is completed
 */
export function isAnalysisCompleted(analysisState: string): boolean {
  return analysisState === "completed";
}

/**
 * Status item with count and color
 */
export type StatusItem = {
  count: number;
  label: string;
  color: "red" | "green" | "orange";
};

/**
 * Pure function to get status items with their colors
 * Returns an array of status items, each with its own color
 * Always shows all three statuses (vulnerable, not vulnerable, uncertain) if their count > 0
 */
export function getStatusItems(productStatus: ProductStatus): StatusItem[] {
  const items: StatusItem[] = [];

  if (productStatus.vulnerableCount > 0) {
    items.push({
      count: productStatus.vulnerableCount,
      label: "Vulnerable",
      color: "red",
    });
  }

  if (productStatus.notVulnerableCount > 0) {
    items.push({
      count: productStatus.notVulnerableCount,
      label: "Not Vulnerable",
      color: "green",
    });
  }

  if (productStatus.uncertainCount > 0) {
    items.push({
      count: productStatus.uncertainCount,
      label: "Uncertain",
      color: "orange",
    });
  }

  return items;
}

/**
 * Pure function to calculate repositories analyzed count
 */
export function calculateRepositoriesAnalyzed(
  componentStates: Record<string, number>
): number {
  return Object.values(componentStates).reduce((sum, count) => sum + count, 0);
}

/**
 * Pure function to format repositories analyzed display
 */
export function formatRepositoriesAnalyzed(
  analyzedCount: number,
  totalCount: number
): string {
  return `${analyzedCount}/${totalCount} analyzed`;
}

/**
 * Pure function to transform product summaries into report rows
 */
export function transformProductSummariesToRows(
  productSummaries: ProductSummary[]
): ReportRow[] {
  const rows: ReportRow[] = [];

  productSummaries.forEach((productSummary) => {
    const reportId = productSummary.data.id;
    const sbomName = productSummary.data.name || "-";
    const completedAt = productSummary.data.completedAt || "";
    const analysisState = productSummary.summary.productState || "-";
    const cves = productSummary.summary.cves || {};
    const componentStates = productSummary.summary.componentStates || {};
    const submittedCount = productSummary.data.submittedCount || 0;

    // Calculate repositories analyzed
    const analyzedCount = calculateRepositoriesAnalyzed(componentStates);
    const repositoriesAnalyzed = formatRepositoriesAnalyzed(
      analyzedCount,
      submittedCount
    );

    // Create a row for each CVE
    const cveIds = Object.keys(cves);
    if (cveIds.length > 0) {
      cveIds.forEach((cveId) => {
        // Calculate CVE-level status with repository counts
        const productStatus = calculateCveStatus(productSummary, cveId);

        const justifications = cves[cveId] || [];
        // Use the first justification if multiple exist
        const justification = justifications[0] || {
          status: "unknown",
          label: "uncertain",
        };
        rows.push({
          reportId,
          sbomName,
          cveId,
          repositoriesAnalyzed,
          exploitIqStatus: justification.status || "unknown",
          exploitIqLabel: justification.label || "uncertain",
          completedAt,
          analysisState,
          productStatus,
        });
      });
    } else {
      // If no CVEs, create a single row with empty CVE
      // Use default status with zero counts
      const productStatus: ProductStatus = {
        status: "unknown",
        vulnerableCount: 0,
        notVulnerableCount: 0,
        uncertainCount: 0,
        totalCount: 0,
      };
      rows.push({
        reportId,
        sbomName,
        cveId: "-",
        repositoriesAnalyzed,
        exploitIqStatus: "unknown",
        exploitIqLabel: "uncertain",
        completedAt,
        analysisState,
        productStatus,
      });
    }
  });

  return rows;
}

/**
 * Pure function to compare two strings with natural sorting
 */
export function compareStrings(
  a: string,
  b: string,
  sortDirection: SortDirection
): number {
  const strA = (a || "").toLowerCase();
  const strB = (b || "").toLowerCase();
  const comparison = strA.localeCompare(strB, undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return sortDirection === "asc" ? comparison : -comparison;
}

/**
 * Pure function to filter and sort report rows
 */
export function filterAndSortReportRows(
  rows: ReportRow[],
  searchValue: string,
  cveSearchValue: string,
  filters: ReportsToolbarFilters,
  sortColumn: SortColumn,
  sortDirection: SortDirection
): ReportRow[] {
  let filtered = rows;

  // Apply SBOM name search filter
  if (searchValue.trim()) {
    const searchLower = searchValue.toLowerCase().trim();
    filtered = filtered.filter((row) =>
      row.sbomName.toLowerCase().includes(searchLower)
    );
  }

  // Apply CVE ID search filter
  if (cveSearchValue.trim()) {
    const searchLower = cveSearchValue.toLowerCase().trim();
    filtered = filtered.filter((row) =>
      row.cveId.toLowerCase().includes(searchLower)
    );
  }

  // Apply ExploitIQ status filter
  if (filters.exploitIqStatus.length > 0) {
    filtered = filtered.filter((row) => {
      const statusItems = getStatusItems(row.productStatus);
      // Check if any of the selected filter options match the row's status items
      return statusItems.some((item) =>
        filters.exploitIqStatus.includes(item.label)
      );
    });
  }

  // Apply Analysis state filter
  if (filters.analysisState.length > 0) {
    filtered = filtered.filter((row) =>
      filters.analysisState.includes(row.analysisState)
    );
  }

  // Apply sorting
  filtered = [...filtered].sort((a, b) => {
    if (sortColumn === "reportId") {
      return compareStrings(a.reportId, b.reportId, sortDirection);
    } else if (sortColumn === "sbomName") {
      return compareStrings(a.sbomName, b.sbomName, sortDirection);
    } else {
      // Sort by completedAt date
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      if (sortDirection === "desc") {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    }
  });

  return filtered;
}

/**
 * Hook to fetch reports and process them for the reports table
 * Follows Rule VI: Complex data processing logic is encapsulated in a custom hook
 * with separate pure functions for data transformation
 */
export function useReportsTableData(
  options: UseReportsTableOptions
): UseReportsTableResult {
  const { searchValue, cveSearchValue, filters, sortColumn, sortDirection } =
    options;

  // Fetch product summaries using the generated API client
  const {
    data: productSummaries,
    loading,
    error,
  } = useApi<Array<ProductSummary>>(() => Reports.getApiReportsProduct());

  // Transform and process the data
  const rows = useMemo(() => {
    if (!productSummaries) {
      return [];
    }

    // Transform product summaries to rows
    const transformedRows = transformProductSummariesToRows(productSummaries);

    // Filter and sort the rows
    return filterAndSortReportRows(
      transformedRows,
      searchValue,
      cveSearchValue,
      filters,
      sortColumn,
      sortDirection
    );
  }, [
    productSummaries,
    searchValue,
    cveSearchValue,
    filters,
    sortColumn,
    sortDirection,
  ]);

  return {
    rows,
    loading,
    error,
  };
}
