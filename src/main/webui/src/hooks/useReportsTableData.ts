import { useMemo } from "react";
import { usePaginatedApi } from "./usePaginatedApi";
import { formatRepositoriesAnalyzed } from "../utils/repositoriesAnalyzed";
import type { Product } from "../generated-client/models/Product";

export type ProductStatus = {
  vulnerableCount: number;
  notVulnerableCount: number;
  uncertainCount: number;
};

export interface ReportRow {
  productId: string;
  sbomName: string;
  cveId: string;
  repositoriesAnalyzed: string;
  completedAt: string;
  analysisState: string;
  productStatus: ProductStatus;
  numReports: number;
  firstReportId?: string; // Always populated with first report's ID from group for navigation
}

export type SortDirection = "asc" | "desc";
export type SortColumn = "productId" | "sbomName" | "completedAt";

export interface UseReportsTableOptions {
  page: number;
  perPage: number;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  sbomName?: string;
  cveId?: string;
}

export interface UseReportsTableResult {
  rows: ReportRow[];
  loading: boolean;
  error: Error | null;
  pagination: {
    totalElements: number;
    totalPages: number;
  } | null;
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
 * Pure function to determine analysis state from statusCounts
 * Returns "completed" if all reports are completed, "analysing" otherwise
 */
export function getAnalysisStateFromStatusCounts(
  statusCounts: Record<string, number>
): string {
  const completedCount = statusCounts["completed"] || 0;
  const totalCount = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  // If all reports are completed, state is "completed"
  if (completedCount === totalCount && totalCount > 0) {
    return "completed";
  }

  // Check for analysing states
  const analysingStates = ["pending", "queued", "sent", "analysing"];
  const hasAnalysing = analysingStates.some(
    (state) => (statusCounts[state] || 0) > 0
  );

  return hasAnalysing ? "analysing" : "completed";
}

/**
 * Pure function to calculate repositories analyzed from statusCounts
 * Uses the "completed" count from statusCounts as analyzedCount
 * and total count as submittedCount
 */
export function calculateRepositoriesFromStatusCounts(
  statusCounts: Record<string, number>
): { analyzedCount: number; submittedCount: number } {
  const analyzedCount = statusCounts["completed"] || 0;
  const submittedCount = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  return { analyzedCount, submittedCount };
}

/**
 * Pure function to transform Product to ReportRow
 */
export function transformGroupedReportRowToRow(groupedRow: Product): ReportRow {
  const sbomName = groupedRow.sbomName || "-";
  const cveId = groupedRow.cveId || "-";
  const completedAt = groupedRow.completedAt || "";

  // Calculate analysis state from statusCounts
  const analysisState = getAnalysisStateFromStatusCounts(
    groupedRow.statusCounts
  );

  // Calculate repositories analyzed from statusCounts
  const { analyzedCount, submittedCount } =
    calculateRepositoriesFromStatusCounts(groupedRow.statusCounts);
  const repositoriesAnalyzed = formatRepositoriesAnalyzed(
    analyzedCount,
    submittedCount
  );

  // Calculate product status from cveStatusCounts
  const cveStatusCounts = groupedRow.cveStatusCounts || {};
  const productStatus: ProductStatus = {
    vulnerableCount: cveStatusCounts["TRUE"] || cveStatusCounts["true"] || 0,
    notVulnerableCount:
      cveStatusCounts["FALSE"] || cveStatusCounts["false"] || 0,
    uncertainCount:
      cveStatusCounts["UNKNOWN"] || cveStatusCounts["unknown"] || 0,
  };

  return {
    productId: groupedRow.productId,
    sbomName,
    cveId,
    repositoriesAnalyzed,
    completedAt,
    analysisState,
    productStatus,
    numReports: groupedRow.numReports,
    firstReportId: groupedRow.firstReportId,
  };
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
 * Pure function to map frontend sort column to API sort field
 */
export function mapSortColumnToApiField(sortColumn: SortColumn): string {
  switch (sortColumn) {
    case "productId":
      return "productId";
    case "sbomName":
      return "sbomName";
    case "completedAt":
      return "completedAt";
    default:
      return "completedAt";
  }
}

/**
 * Pure function to map frontend sort direction to API sort direction
 */
export function mapSortDirectionToApi(sortDirection: SortDirection): string {
  return sortDirection.toUpperCase();
}

/**
 * Hook to fetch reports and process them for the reports table
 * Follows Rule VI: Complex data processing logic is encapsulated in a custom hook
 * with separate pure functions for data transformation
 * Uses server-side pagination, filtering, and sorting via /api/v1/reports/grouped endpoint
 */
export function useReportsTableData(
  options: UseReportsTableOptions
): UseReportsTableResult {
  const { page, perPage, sortColumn, sortDirection, sbomName, cveId } = options;

  // Map frontend sort parameters to API parameters
  const sortField = mapSortColumnToApiField(sortColumn);
  const sortDirectionApi = mapSortDirectionToApi(sortDirection);

  // Build query parameters
  const queryParams: Record<string, any> = {
    page: page - 1, // API uses 0-based pagination
    pageSize: perPage,
    sortField,
    sortDirection: sortDirectionApi,
  };

  if (sbomName) queryParams.sbomName = sbomName;
  if (cveId) queryParams.cveId = cveId;

  // Fetch products using usePaginatedApi
  const {
    data: groupedRows,
    loading,
    error,
    pagination,
  } = usePaginatedApi<Array<Product>>(
    () => ({
      method: "GET",
      url: "/api/v1/products",
      query: queryParams,
    }),
    {
      deps: [page, perPage, sortField, sortDirectionApi, sbomName, cveId],
    }
  );

  // Transform grouped rows to report rows
  const rows = useMemo(() => {
    if (!groupedRows) {
      return [];
    }

    return groupedRows.map(transformGroupedReportRowToRow);
  }, [groupedRows]);

  return {
    rows,
    loading,
    error,
    pagination,
  };
}
