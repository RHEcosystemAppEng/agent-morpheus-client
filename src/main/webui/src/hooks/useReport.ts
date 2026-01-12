import { useApi } from "./useApi";
import {
  ReportEndpointService,
  ProductSummary,
} from "../generated-client";

export interface UseReportResult {
  data: ProductSummary | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch product summary data for a report page
 * @param productId - The product ID to fetch data for
 * @returns Object with data, loading, and error states
 */
export function useReport(productId: string): UseReportResult {
  const { data, loading, error } = useApi<ProductSummary>(
    () => ReportEndpointService.getApiV1ReportsProduct1({ id: productId }),
    { deps: [productId] }
  );

  return { data: data || null, loading, error };
}

