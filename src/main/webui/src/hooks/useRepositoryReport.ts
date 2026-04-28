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

import { useApi } from "./useApi";
import { getRepositoryReport } from "../utils/reportApi";
import type { FullReport } from "../types/FullReport";
import type { ReportWithStatus } from "../generated-client";
import { isFailingState } from "../utils/findingDisplay";
export interface UseRepositoryReportResult {
  data?: FullReport;
  status?: string;
  loading: boolean;
  error: Error | null;
}

/**
 * Whether to run live-update–driven refetches for this repository report fetch.
 * Skips refetches when status is completed or a terminal failure state.
 */
export function shouldContinueLiveRefreshForRepositoryReport(
  response: ReportWithStatus | null
): boolean {
  if (!response) return true; // Continue until first payload
  const status = response.status ?? "";
  // Stop when completed or any terminal failure (failed, expired, etc.)
  if (status === "completed" || isFailingState(status)) {
    return false;
  }
  return true;
}

/**
 * Hook to fetch repository report data with server live-update refetch.
 *
 * @param reportId - The report ID to fetch data for
 * @returns Object with data (report), status, loading, and error states
 */
export function useRepositoryReport(reportId: string): UseRepositoryReportResult {
  const { data: response, loading, error } = useApi<ReportWithStatus>(
    () => getRepositoryReport(reportId),
    {
      deps: [reportId],
      liveUpdatesRefresh: true,
      shouldRefresh: shouldContinueLiveRefreshForRepositoryReport,
    }
  );

  return { 
    data: response?.report, 
    status: response?.status,
    loading, 
    error 
  };
}
