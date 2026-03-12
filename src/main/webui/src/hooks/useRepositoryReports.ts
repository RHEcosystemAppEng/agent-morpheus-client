/**
 * Hook for fetching repository reports with pagination, filtering, and auto-refresh
 */

import { useMemo } from "react";
import { usePaginatedApi } from "./usePaginatedApi";
import { Report } from "../generated-client";
import {
  POLL_INTERVAL_MS,
  REPORTS_TABLE_POLL_INTERVAL_MS,
} from "../utils/polling";
import { getFindingFilterApiParams } from "../components/Filtering";
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
  /** When provided, fetches reports for this product and CVE. When omitted, fetches single-repository reports (no product_id). */
  productId?: string;
  cveId?: string;
  /** When provided, polling runs while this returns true. Used e.g. to poll until product analysis is completed. */
  shouldContinuePolling?: () => boolean;
  /** Polling interval in ms. When omitted, defaults to 5000 in product context and 15000 for single-repository. */
  pollInterval?: number;
  page: number;
  perPage: number;
  sortColumn: "gitRepo" | "submittedAt" | "completedAt";
  sortDirection: "asc" | "desc";
  findingFilter: string[];
  repositorySearchValue: string;
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
 * Hook to fetch repository reports with server-side pagination, sorting, filtering, and optional auto-refresh.
 * Use pollInterval to set the refresh interval and shouldContinuePolling to stop when a condition is met.
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
    findingFilter,
    repositorySearchValue,
    shouldContinuePolling,
    pollInterval: pollIntervalOption,
  } = options;

  const isProductContext = productId != null && cveId != null;

  const pollInterval =
    pollIntervalOption ??
    (isProductContext ? POLL_INTERVAL_MS : REPORTS_TABLE_POLL_INTERVAL_MS);

  const { status: statusFilterValue, exploitIqStatus: exploitIqStatusApiValue } =
    useMemo(() => getFindingFilterApiParams(findingFilter), [findingFilter]);

  const sortByParam = useMemo(() => {
    return [`${sortColumn}:${sortDirection.toUpperCase()}`];
  }, [sortColumn, sortDirection]);

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
        ...(isProductContext
          ? { productId, vulnId: cveId }
          : { withoutProduct: true }),
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
        isProductContext,
        productId,
        cveId,
        sortByParam,
        statusFilterValue ?? "",
        exploitIqStatusApiValue ?? "",
        repositorySearchValue,
        pollInterval,
      ],
      pollInterval,
      ...(shouldContinuePolling && {
        shouldPoll: shouldContinuePolling,
        shouldUpdate: (previousReports, currentReports) => {
          return hasReportStatesChanged(previousReports, currentReports);
        },
      }),
    }
  );

  return {
    data: reports || null,
    loading,
    error,
    pagination,
  };
}

