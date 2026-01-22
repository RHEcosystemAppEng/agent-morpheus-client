import { useApi } from "./useApi";
import type { Product } from "../generated-client/models/Product";

export interface UseReportResult {
  data: Product | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch product data for a report page
 * @param productId - The product ID to fetch data for
 * @returns Object with data, loading, and error states
 */
export function useReport(productId: string): UseReportResult {
  const { data, loading, error } = useApi<Product>(
    async () => {
      const response = await fetch(`/api/v1/products/${productId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
      return response.json();
    },
    { deps: [productId] }
  );

  return { data: data || null, loading, error };
}

