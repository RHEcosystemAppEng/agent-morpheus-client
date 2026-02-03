import { useApi } from "./useApi";
import { getRepositoryReport } from "../utils/reportApi";
import { POLL_INTERVAL_MS } from "../utils/polling";
import type { FullReport } from "../types/FullReport";

export interface UseRepositoryReportResult {
  data: FullReport | null;
  loading: boolean;
  error: Error | null;
}

/**
   If the report state has changed, it indicates that the report has been updated
 */
export function hasRepositoryReportStateChanged(
  previousReport: FullReport | null,
  currentReport: FullReport
): boolean {
  // If no previous data, always update (initial load)
  if (!previousReport) {
    return true;
  }

  return previousReport.state !== currentReport.state;
}

/**
 * Pure function to determine if polling should continue based on report state
 * Returns true if polling should continue, false to stop
 */
export function shouldContinuePollingRepositoryReport(
  report: FullReport | null
): boolean {
  if (!report) return true; // Continue polling if no data yet
  const state = report.state;
  // Continue polling if state is not "completed" or "failed"
  return state !== "completed" && state !== "failed";
}

/**
 * Hook to fetch repository report data with conditional auto-refresh.
 * Auto-refresh continues while report state is not "completed" or "failed".
 * Only updates state when report state or other relevant data have changed to prevent unnecessary rerenders.
 * 
 * @param reportId - The report ID to fetch data for
 * @returns Object with data, loading, and error states
 */
export function useRepositoryReport(reportId: string): UseRepositoryReportResult {
  const { data, loading, error } = useApi<FullReport>(
    () => getRepositoryReport(reportId),
    {
      deps: [reportId],
      pollInterval: POLL_INTERVAL_MS,
      shouldPoll: shouldContinuePollingRepositoryReport,
      shouldUpdate: hasRepositoryReportStateChanged,
    }
  );

  return { data: data || null, loading, error };
}

