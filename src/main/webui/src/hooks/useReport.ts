import { useApi } from "./useApi";
import type { Product } from "../generated-client/models/Product";
import { POLL_INTERVAL_MS, shouldContinuePollingByStatusCounts } from "../utils/polling";
import { ProductEndpointService } from "../generated-client";
import { isEqual } from "lodash";

export interface UseReportResult {
  data: Product | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Pure function to compare Product objects between two arrays
 * Compares all fields of each product using deep comparison
 * Returns true if any product data has changed, false otherwise
 */
export function hasProductStatusCountsChanged(
  previousProduct: Product | null,
  currentProduct: Product
): boolean {
  // If no previous data, always update (initial load)
  if (!previousProduct) {
    return true;
  }

  return !isEqual(previousProduct, currentProduct);
}

/**
 * Hook to fetch product data for a report page with conditional auto-refresh.
 * Auto-refresh continues while product data has changed.
 * Only updates state when product data has changed to prevent unnecessary rerenders.
 * 
 * @param productId - The product ID to fetch data for
 * @returns Object with data, loading, and error states
 */
export function useReport(productId: string): UseReportResult {
  const { data, loading, error } = useApi<Product>(
    () => ProductEndpointService.getApiV1Products1({ productId: productId }),
    {
      deps: [productId],
      pollInterval: POLL_INTERVAL_MS,
      shouldPoll: (product) => shouldContinuePollingByStatusCounts(product?.statusCounts),
      shouldUpdate: (previousProduct, currentProduct) => {
        return hasProductStatusCountsChanged(previousProduct, currentProduct);
      },
    }
  );

  return { data: data || null, loading, error };
}

