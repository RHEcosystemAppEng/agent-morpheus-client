import { useMemo } from "react";
import type React from "react";
import { isEqual } from "lodash";
import { usePaginatedApi } from "./usePaginatedApi";
import { formatRepositoriesAnalyzed } from "../utils/repositoriesAnalyzed";
import { REPORTS_TABLE_POLL_INTERVAL_MS } from "../utils/polling";
import type { ProductSummary } from "../generated-client/models/ProductSummary";

export type ProductStatus = {
  vulnerableCount: number;
  notVulnerableCount: number;
  uncertainCount: number;
};

export interface ReportRow {
  productId: string;
  productName: string;
  cveId: string;
  repositoriesAnalyzed: string;
  submittedAt: string;
  completedAt: string;
  analysisState: string;
  productStatus: ProductStatus;
  submittedCount?: number;
  statusCounts: Record<string, number>;
}

export type SortDirection = "asc" | "desc";
export type SortColumn = "name" | "submittedAt" | "completedAt" | "cveId";

export interface UseReportsTableOptions {
  page: number;
  perPage: number;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  name?: string;
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
 * function to check if analysis is completed
 */
export function isAnalysisCompleted(analysisState: string): boolean {
  return analysisState === "completed";
}

/**
 * Finding type for single prioritized finding display
 */
export type Finding = {
  type: "vulnerable" | "uncertain" | "in-progress" | "not-vulnerable" | "failed";
  label: string;
  count?: number;
  color?: "red" | "green" | "orange" | "grey";
  variant?: "filled" | "outline";
  icon?: React.ReactNode;
};

export function getFinding(
  productStatus: ProductStatus,
  analysisState: string,
  statusCounts: Record<string, number>
): Finding | null {
  // Priority 1: Vulnerable (1 or more repos are vulnerable)
  if (productStatus.vulnerableCount > 0) {
    return {
      type: "vulnerable",
      label: "Vulnerable",
      count: productStatus.vulnerableCount,
      color: "red",
    };
  }

  // Priority 2: Uncertain (0 vulnerable, 1 or more uncertain)
  if (productStatus.uncertainCount > 0) {
    return {
      type: "uncertain",
      label: "Uncertain",
      count: productStatus.uncertainCount,
      color: "orange",
    };
  }

  // Priority 3: In progress (0 vulnerable, 0 uncertain, has queued/sent/pending states)
  const inProgressStates = ["queued", "sent", "pending"];
  const hasInProgress = inProgressStates.some(
    (state) => (statusCounts[state] || 0) > 0
  );
  if (hasInProgress) {
    return {
      type: "in-progress",
      label: "In progress",
      variant: "outline",
      color: "grey",
    };
  }

  // Calculate counts for failed/expired and completed states
  const failedCount = (statusCounts["failed"] || 0) + (statusCounts["expired"] || 0);
  const completedCount = statusCounts["completed"] || 0;
  const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  // Priority 4: Not vulnerable (100% analyzed, 0 vulnerable, 0 uncertain, 1+ not vulnerable, no failed)
  if (analysisState === "completed" && productStatus.notVulnerableCount > 0 && failedCount === 0) {
    // Only show "Not vulnerable" if all reports are completed (no failed/expired)
    if (completedCount === totalCount && totalCount > 0) {
      return {
        type: "not-vulnerable",
        label: "Not vulnerable",
        count: productStatus.notVulnerableCount,
        color: "green",
      };
    }
  }

  // Priority 5: Failed (100% failed/expired OR some failed and rest not vulnerable)
  if (failedCount > 0) {
    // All failed/expired OR some failed and rest completed with not vulnerable
    if (failedCount === totalCount || (failedCount > 0 && completedCount > 0 && productStatus.notVulnerableCount > 0)) {
      return {
        type: "failed",
        label: "Failed",
        variant: "filled",
        color: "grey",
      };
    }
  }

  // Default: return null if no finding can be determined
  return null;
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
 * Pure function to transform ProductSummary to ReportRow
 */
export function transformProductSummaryToRow(productSummary: ProductSummary): ReportRow {
  const product = productSummary.data;
  const summary = productSummary.summary;
  
  const productId = product.id || "-";
  const productName = product.name || "-";
  const cveId = product.cveId || "-";
  const submittedAt = product.submittedAt || "";
  const completedAt = product.completedAt || "";

  // Calculate analysis state from statusCounts
  const statusCounts = summary.statusCounts || {};
  const analysisState = getAnalysisStateFromStatusCounts(statusCounts);

  // Calculate repositories analyzed from statusCounts
  const { analyzedCount, submittedCount } =
    calculateRepositoriesFromStatusCounts(statusCounts);
  const repositoriesAnalyzed = formatRepositoriesAnalyzed(
    analyzedCount,
    submittedCount
  );

  // Calculate product status from justificationStatusCounts
  const justificationStatusCounts = summary.justificationStatusCounts || {};
  const productStatus: ProductStatus = {
    vulnerableCount: justificationStatusCounts["TRUE"] || justificationStatusCounts["true"] || 0,
    notVulnerableCount:
      justificationStatusCounts["FALSE"] || justificationStatusCounts["false"] || 0,
    uncertainCount:
      justificationStatusCounts["UNKNOWN"] || justificationStatusCounts["unknown"] || 0,
  };

  return {
    productId,
    productName,
    cveId,
    repositoriesAnalyzed,
    submittedAt,
    completedAt,
    analysisState,
    productStatus,
    submittedCount: product.submittedCount,
    statusCounts,
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
    case "name":
      return "name";
    case "submittedAt":
      return "submittedAt";
    case "completedAt":
      return "completedAt";
    case "cveId":
      return "cveId";
    default:
      return "submittedAt";
  }
}

/**
 * Pure function to map frontend sort direction to API sort direction
 */
export function mapSortDirectionToApi(sortDirection: SortDirection): string {
  return sortDirection.toUpperCase();
}

/**
 * Pure function to compare ProductSummary objects between two arrays
 * Compares all fields of each product summary using deep comparison
 * Since the array contains maximum 100 products, and the number of fields is limited, the performance impact is negligible
 */
export function haveReportStatesChanged(
  previousProducts: ProductSummary[] | null,
  currentProducts: ProductSummary[]
): boolean {
  // If no previous data, always update (initial load)
  if (!previousProducts || previousProducts.length === 0) {
    return true;
  }

  // If different number of products, update
  if (previousProducts.length !== currentProducts.length) {
    return true;
  }

  // Deep comparison of full ProductSummary objects using lodash isEqual
  return !isEqual(previousProducts, currentProducts);
}

/**
 * Hook to fetch reports and process them for the reports table
 * Follows Rule VI: Complex data processing logic is encapsulated in a custom hook
 * with separate pure functions for data transformation
 * Uses server-side pagination, filtering, and sorting via /api/v1/products endpoint
 */
export function useReportsTableData(
  options: UseReportsTableOptions
): UseReportsTableResult {
  const { page, perPage, sortColumn, sortDirection, name, cveId } = options;

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

  if (name) queryParams.name = name;
  if (cveId) queryParams.cveId = cveId;

  // Fetch products using usePaginatedApi with auto-refresh
  const {
    data: productSummaries,
    loading,
    error,
    pagination,
  } = usePaginatedApi<Array<ProductSummary>>(
    () => ({
      method: "GET",
      url: "/api/v1/reports/product",
      query: queryParams,
    }),
    {
      deps: [page, perPage, sortField, sortDirectionApi, name, cveId],
      pollInterval: REPORTS_TABLE_POLL_INTERVAL_MS,
      shouldUpdate: (previousData, currentData) => {
        return haveReportStatesChanged(previousData, currentData);
      },
    }
  );

  // Transform product summaries to report rows
  const rows = useMemo(() => {
    if (!productSummaries) {
      return [];
    }

    return productSummaries.map(transformProductSummaryToRow);
  }, [productSummaries]);

  return {
    rows,
    loading,
    error,
    pagination,
  };
}
