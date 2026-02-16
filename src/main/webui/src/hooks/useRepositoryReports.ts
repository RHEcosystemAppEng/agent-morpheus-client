/**
 * Hook for fetching repository reports with pagination, filtering, and auto-refresh
 */

import { useMemo } from "react";
import { usePaginatedApi } from "./usePaginatedApi";
import { Report, ProductSummary } from "../generated-client";
import { POLL_INTERVAL_MS, shouldContinuePollingByStatusCounts } from "../utils/polling";
import { mapDisplayLabelToApiValue } from "../components/Filtering";
import isEqual from "lodash/isEqual";

/**
 * Pure function to compare report states between two arrays of reports
 * Compares all fields of each report using deep comparison
 * Since the array contains maximum 100 reports, the performance impact is negligible
 */
export function hasReportStatesChanged(
  previousReports: Report[] | null,
  currentReports: Report[]
): boolean {
  // If no previous data, always update (initial load)
  if (!previousReports || previousReports.length === 0) {
    return true;
  }

  // If different number of reports, update
  if (previousReports.length !== currentReports.length) {
    return true;
  }

  return !isEqual(previousReports, currentReports);
}

export interface UseRepositoryReportsOptions {
  productId: string;
  cveId: string;
  page: number;
  perPage: number;
  sortColumn: "gitRepo" | "completedAt" | "state";
  sortDirection: "asc" | "desc";
  scanStateFilter: string[];
  exploitIqStatusFilter: string[];
  repositorySearchValue: string;
  product: ProductSummary; // Used for determining polling condition
}

export interface UseRepositoryReportsResult {
  data: Report[] | null;
  loading: boolean;
  error: Error | null;
  pagination: {
    totalElements: number;
    totalPages: number;
  } | null;
}

/**
 * Hook to fetch repository reports with server-side pagination, sorting, filtering, and conditional auto-refresh.
 * Auto-refresh continues while analysis states in product.statusCounts are not "failed" or "completed".
 */
export function useRepositoryReports(
  options: UseRepositoryReportsOptions
): UseRepositoryReportsResult {
  const {
    productId,
    cveId,
    page,
    perPage,
    sortColumn,
    sortDirection,
    scanStateFilter,
    exploitIqStatusFilter,
    repositorySearchValue,
    product,
  } = options;

  // Convert filter array to comma-separated API values
  const exploitIqStatusApiValue = useMemo(() => {
    if (exploitIqStatusFilter.length === 0) return undefined;
    return exploitIqStatusFilter
      .map((label) => mapDisplayLabelToApiValue(label))
      .join(",");
  }, [exploitIqStatusFilter]);

  // Build sortBy parameter for API
  const sortByParam = useMemo(() => {
    return [`${sortColumn}:${sortDirection.toUpperCase()}`];
  }, [sortColumn, sortDirection]);

  // Build status filter - send all selected status values as comma-separated string
  const statusFilterValue = useMemo(() => {
    if (scanStateFilter.length === 0) return undefined;
    return scanStateFilter.join(",");
  }, [scanStateFilter]);

  // Determine if auto-refresh should continue based on product statusCounts
  const shouldContinuePolling = useMemo(() => {
    return shouldContinuePollingByStatusCounts(product.summary.statusCounts);
  }, [product.summary.statusCounts]);

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = usePaginatedApi<Array<Report>>(
    () => ({
      method: "GET" as const,
      url: "/api/v1/reports",
      query: {
        page: page - 1,
        pageSize: perPage,
        productId: productId,
        vulnId: cveId,
        sortBy: sortByParam,
        ...(statusFilterValue && { status: statusFilterValue }),
        ...(exploitIqStatusApiValue && {
          exploitIqStatus: exploitIqStatusApiValue,
        }),
        ...(repositorySearchValue && { gitRepo: repositorySearchValue }),
      },
    }),
    {
      deps: [
        page,
        perPage,
        productId,
        cveId,
        sortByParam,
        statusFilterValue,
        exploitIqStatusApiValue,
        repositorySearchValue,
      ],
      pollInterval: POLL_INTERVAL_MS,
      shouldPoll: () => shouldContinuePolling,
      shouldUpdate: (previousReports, currentReports) => {
        return hasReportStatesChanged(previousReports, currentReports);
      },
    }
  );

  return {
    data: reports || null,
    loading,
    error,
    pagination,
  };
}

