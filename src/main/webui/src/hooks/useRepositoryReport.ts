import { useApi } from "./useApi";
import { getRepositoryReport } from "../utils/reportApi";
import { POLL_INTERVAL_MS } from "../utils/polling";
import type { FullReport } from "../types/FullReport";
import type { ReportWithStatus } from "../generated-client";
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
  const status = response.status;
  console.log("status", status);
  // Continue polling if status is not "completed" or "failed"
  return status !== "completed" && status !== "failed";
}

/**
 * Hook to fetch repository report data with conditional auto-refresh.
 * Auto-refresh continues while report status is not "completed" or "failed".
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

