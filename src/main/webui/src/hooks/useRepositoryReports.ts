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
import isEqual from "lodash/isEqual";
import { displayToApi, JUSTIFICATION_DISPLAY_LABELS } from "../utils/justificationStatus";
import type { UseTableParamsData } from "./useTableParams";
import type { RepoFilterKey } from "./repositoryReportsTableParams";

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
  /** Table state from useTableParams().data; defaults applied inside this hook. */
  tableData: UseTableParamsData<"gitRepo" | "submittedAt" | "completedAt", RepoFilterKey>;
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
 * Maps finding filter selection to API params: status (for In progress / Failed) and exploitIqStatus (for Vulnerable / Not Vulnerable / Uncertain).
 * When no value is selected (undefined), returns no filter so the backend returns all.
 */
export function getFindingFilterApiParams(
  findingFilter: string | undefined
): {
  status?: string;
  exploitIqStatus?: string;
} {
  if (findingFilter == null || findingFilter === "") {
    return {};
  }
  const statusParts: string[] = [];
  if (findingFilter === "In progress") {
    statusParts.push("pending", "queued", "sent");
  }
  if (findingFilter === "Failed") {
    statusParts.push("expired", "failed");
  }
  const exploitParts = (JUSTIFICATION_DISPLAY_LABELS as readonly string[]).includes(
    findingFilter
  )
    ? [displayToApi(findingFilter)]
    : [];
  return {
    status: statusParts.length > 0 ? statusParts.join(",") : undefined,
    exploitIqStatus:
      exploitParts.length > 0 ? exploitParts.join(",") : undefined,
  };
}

/**
 * Hook to fetch repository reports with server-side pagination, sorting, filtering, and optional auto-refresh.
 * Use pollInterval to set the refresh interval and shouldContinuePolling to stop when a condition is met.
 */
const DEFAULT_PER_PAGE = 10;

export function useRepositoryReports(
  options: UseRepositoryReportsOptions
): UseRepositoryReportsResult {
  const {
    productId,
    cveId,
    tableData,
    shouldContinuePolling,
    pollInterval: pollIntervalOption,
  } = options;

  const page = tableData.page ?? 1;
  const perPage = tableData.perPage ?? DEFAULT_PER_PAGE;
  const sortColumn = tableData.sortColumn ?? "submittedAt";
  const sortDirection = tableData.sortDirection ?? "desc";
  const repositorySearchValue = tableData.getFilterValue("gitRepo") ?? "";
  const cveIdFilter = tableData.getFilterValue("cveId") ?? "";
  const findingFilter = tableData.getFilterValue("finding") ?? undefined;

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
          : {
              withoutProduct: "true",
              ...(cveIdFilter?.trim() && { vulnId: cveIdFilter.trim() }),
            }),
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
        cveIdFilter ?? "",
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

