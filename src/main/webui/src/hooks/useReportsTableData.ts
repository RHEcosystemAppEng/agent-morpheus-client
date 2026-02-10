import { useMemo } from "react";
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
