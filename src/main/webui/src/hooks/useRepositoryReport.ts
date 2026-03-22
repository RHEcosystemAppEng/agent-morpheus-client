import { useApi } from "./useApi";
import { getRepositoryReport } from "../utils/reportApi";
import { POLL_INTERVAL_MS } from "../utils/polling";
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
   If the report status has changed, it indicates that the report has been updated
 */
export function hasRepositoryReportStateChanged(
  previousResponse: ReportWithStatus | null,
  currentResponse: ReportWithStatus
): boolean {
  // If no previous data, always update (initial load)
  if (!previousResponse) {
    return true;
  }
  return previousResponse.status !== currentResponse.status;
}

/**
 * Pure function to determine if polling should continue based on report status
 * Returns true if polling should continue, false to stop
 */
export function shouldContinuePollingRepositoryReport(
  response: ReportWithStatus | null
): boolean {
  if (!response) return true; // Continue polling if no data yet
  const status = response.status ?? "";
  // Stop when completed or any terminal failure (failed, expired, etc.)
  if (status === "completed" || isFailingState(status)) {
    return false;
  }
  return true;
}

/**
 * Hook to fetch repository report data with conditional auto-refresh.
 * Auto-refresh continues until status is "completed" or a failing state (e.g. failed, expired).
 * Only updates state when report status or other relevant data have changed to prevent unnecessary rerenders.
 * 
 * @param reportId - The report ID to fetch data for
 * @returns Object with data (report), status, loading, and error states
 */
export function useRepositoryReport(reportId: string): UseRepositoryReportResult {
  const { data: response, loading, error } = useApi<ReportWithStatus>(
    () => getRepositoryReport(reportId),
    {
      deps: [reportId],
      pollInterval: POLL_INTERVAL_MS,
      shouldPoll: shouldContinuePollingRepositoryReport,
      shouldUpdate: hasRepositoryReportStateChanged,
    }
  );

  return { 
    data: response?.report, 
    status: response?.status,
    loading, 
    error 
  };
}

