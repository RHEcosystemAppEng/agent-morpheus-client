// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Hook for fetching repository reports with pagination, filtering, and auto-refresh
 */

import { useMemo } from "react";
import { usePaginatedApi } from "./usePaginatedApi";
import { Report } from "../generated-client";
import { displayToApi, JUSTIFICATION_DISPLAY_LABELS } from "../utils/justificationStatus";
import type { UseTableParamsData } from "./useTableParams";
import type { RepoFilterKey } from "./repositoryReportsTableParams";

export interface UseRepositoryReportsOptions {
  /** When provided, fetches reports for this product and CVE. When omitted, fetches single-repository reports (no product_id). */
  productId?: string;
  cveId?: string;
  /** When provided, SSE-driven refetches run only while this returns true (e.g. until product analysis completes). */
  shouldContinueLiveRefresh?: () => boolean;
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
 * Hook to fetch repository reports with server-side pagination, sorting, filtering, and optional live-update refetch.
 */
const DEFAULT_PER_PAGE = 10;

export function useRepositoryReports(
  options: UseRepositoryReportsOptions
): UseRepositoryReportsResult {
  const {
    productId,
    cveId,
    tableData,
    shouldContinueLiveRefresh,
  } = options;

  const page = tableData.page ?? 1;
  const perPage = tableData.perPage ?? DEFAULT_PER_PAGE;
  const sortColumn = tableData.sortColumn ?? "submittedAt";
  const sortDirection = tableData.sortDirection ?? "desc";
  const repositorySearchValue = tableData.getFilterValue("gitRepo") ?? "";
  const cveIdFilter = tableData.getFilterValue("cveId") ?? "";
  const findingFilter = tableData.getFilterValue("finding") ?? undefined;

  const isProductContext = productId != null && cveId != null;

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
      ],
      liveUpdatesRefresh: true,
      ...(shouldContinueLiveRefresh && {
        shouldRefresh: (_data: Report[] | null) => shouldContinueLiveRefresh(),
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
