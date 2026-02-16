import { useApi } from "./useApi";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import { POLL_INTERVAL_MS, shouldContinuePollingByStatusCounts } from "../utils/polling";
import { request } from "../generated-client/core/request";
import { OpenAPI } from "../generated-client/core/OpenAPI";
import isEqual from "lodash/isEqual";

export interface UseReportResult {
  data: ProductSummary | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Pure function to compare ProductSummary objects
 * Compares all fields of the product summary using deep comparison
 * Returns true if any product data has changed, false otherwise
 */
export function hasProductStatusCountsChanged(
  previousProduct: ProductSummary | null,
  currentProduct: ProductSummary
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
export function useReport(productId: string | undefined): UseReportResult {
  if (!productId) {
    return { data: null, loading: false, error: new Error("Product ID is required") };
  }

  const { data, loading, error } = useApi<ProductSummary>(
    () => request<ProductSummary>(OpenAPI, {
      method: "GET",
      url: `/api/v1/reports/product/${productId}`,
      errors: {
        404: "Product not found",
        500: "Internal server error",
      },
    }),
    {
      deps: [productId],
      pollInterval: POLL_INTERVAL_MS,
      shouldPoll: (product) => shouldContinuePollingByStatusCounts(product?.summary?.statusCounts),
      shouldUpdate: (previousProduct, currentProduct) => {
        return hasProductStatusCountsChanged(previousProduct, currentProduct);
      },
    }
  );

  return { data: data || null, loading, error };
}

