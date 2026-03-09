/**
 * Hook for fetching repository reports that have no product_id (single repositories),
 * with pagination, filtering, and sorting.
 */

import { useMemo } from "react";
import { usePaginatedApi } from "./usePaginatedApi";
import type { Report } from "../generated-client/models/Report";
import { mapDisplayLabelToApiValue } from "../components/Filtering";

export interface UseSingleRepositoryReportsOptions {
  page: number;
  perPage: number;
  sortColumn: "gitRepo" | "completedAt" | "state";
  sortDirection: "asc" | "desc";
  scanStateFilter: string[];
  exploitIqStatusFilter: string[];
  repositorySearchValue: string;
}

export interface UseSingleRepositoryReportsResult {
  data: Report[] | null;
  loading: boolean;
  error: Error | null;
  pagination: {
    totalElements: number;
    totalPages: number;
  } | null;
}

export function useSingleRepositoryReports(
  options: UseSingleRepositoryReportsOptions
): UseSingleRepositoryReportsResult {
  const {
    page,
    perPage,
    sortColumn,
    sortDirection,
    scanStateFilter,
    exploitIqStatusFilter,
    repositorySearchValue,
  } = options;

  const exploitIqStatusApiValue = useMemo(() => {
    if (exploitIqStatusFilter.length === 0) return undefined;
    return exploitIqStatusFilter
      .map((label) => mapDisplayLabelToApiValue(label))
      .join(",");
  }, [exploitIqStatusFilter]);

  const sortByParam = useMemo(() => {
    return [`${sortColumn}:${sortDirection.toUpperCase()}`];
  }, [sortColumn, sortDirection]);

  const statusFilterValue = useMemo(() => {
    if (scanStateFilter.length === 0) return undefined;
    return scanStateFilter.join(",");
  }, [scanStateFilter]);

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = usePaginatedApi<Report[]>(
    () => ({
      method: "GET" as const,
      url: "/api/v1/reports",
      query: {
        page: page - 1,
        pageSize: perPage,
        withoutProduct: true,
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
        sortByParam,
        statusFilterValue,
        exploitIqStatusApiValue,
        repositorySearchValue,
      ],
    }
  );

  return {
    data: reports || null,
    loading,
    error,
    pagination,
  };
}
