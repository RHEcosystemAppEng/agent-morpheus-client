import { useApi } from "./useApi";
import type { SbomReport } from "../generated-client/models/SbomReport";
import { POLL_INTERVAL_MS, shouldContinuePollingByStatusCounts } from "../utils/polling";
import { SbomReportEndpointService } from "../generated-client";
import { isEqual } from "lodash";

export interface UseReportResult {
  data: SbomReport | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Pure function to compare SbomReport objects between two arrays
 * Compares all fields of each SBOM report using deep comparison
 * Returns true if any SBOM report data has changed, false otherwise
 */
export function hasProductStatusCountsChanged(
  previousProduct: SbomReport | null,
  currentProduct: SbomReport
): boolean {
  // If no previous data, always update (initial load)
  if (!previousProduct) {
    return true;
  }

  return !isEqual(previousProduct, currentProduct);
}

/**
 * Hook to fetch SBOM report data for a report page with conditional auto-refresh.
 * Auto-refresh continues while SBOM report data has changed.
 * Only updates state when SBOM report data has changed to prevent unnecessary rerenders.
 * 
 * @param sbomReportId - The SBOM report ID to fetch data for
 * @returns Object with data, loading, and error states
 */
export function useReport(sbomReportId: string): UseReportResult {
  const { data, loading, error } = useApi<SbomReport>(
    () => SbomReportEndpointService.getApiV1SbomReports1({ sbomReportId }),
    {
      deps: [sbomReportId],
      pollInterval: POLL_INTERVAL_MS,
      shouldPoll: (product) => shouldContinuePollingByStatusCounts(product?.statusCounts),
      shouldUpdate: (previousProduct, currentProduct) => {
        return hasProductStatusCountsChanged(previousProduct, currentProduct);
      },
    }
  );

  return { data: data || null, loading, error };
}

