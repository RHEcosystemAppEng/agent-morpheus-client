import { useMemo } from "react";
import type React from "react";
import { isEqual } from "lodash";
import { usePaginatedApi } from "./usePaginatedApi";
import { getRepositoriesAnalyzedFromProduct } from "../utils/repositoriesAnalyzed";
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
  submittedCount?: number;
  finding: Finding | null;
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
  type: "vulnerable" | "uncertain" | "in-progress" | "not-vulnerable" | "failed" | "excluded";
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

  // Priority 3: In progress (analysis state is not completed)
  if (!isAnalysisCompleted(analysisState)) {
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

  // Priority 4: Failed (100% failed/expired OR some failed and rest not vulnerable)
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

  // Priority 5: Excluded (one or more components excluded from analysis, e.g. submission failures)
  const excludedCount = statusCounts["excluded"] || 0;
  if (excludedCount > 0) {
    return {
      type: "excluded",
      label: "Excluded",
      count: excludedCount,
      color: "grey",
    };
  }

  // Priority 6: Not vulnerable (100% complete AND 100% not vulnerable)
  if (
    analysisState === "completed" &&
    totalCount > 0 &&
    productStatus.notVulnerableCount === totalCount
  ) {
    return {
      type: "not-vulnerable",
      label: "Not vulnerable",
      color: "green",
    };
  }

  // Default: return null if no finding can be determined
  return null;
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
  const analysisState = productSummary.summary.productState;

  // Repositories analyzed from shared utility (completed + data.submittedCount, "analyzed" suffix)
  const { getDisplay } = getRepositoriesAnalyzedFromProduct(productSummary);
  const repositoriesAnalyzed = getDisplay("analyzed");

  // Calculate product status from justificationStatusCounts
  const justificationStatusCounts = summary.justificationStatusCounts || {};
  const productStatus: ProductStatus = {
    vulnerableCount: justificationStatusCounts["TRUE"] || justificationStatusCounts["true"] || 0,
    notVulnerableCount:
      justificationStatusCounts["FALSE"] || justificationStatusCounts["false"] || 0,
    uncertainCount:
      justificationStatusCounts["UNKNOWN"] || justificationStatusCounts["unknown"] || 0,
  };

  const finding = getFinding(productStatus, analysisState, statusCounts);

  return {
    productId,
    productName,
    cveId,
    repositoriesAnalyzed,
    submittedAt,
    completedAt,
    submittedCount: product.submittedCount,
    finding,
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
