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
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import { shouldContinueLiveRefreshForProduct } from "../utils/liveRefresh";
import { request } from "../generated-client/core/request";
import { OpenAPI } from "../generated-client/core/OpenAPI";

export interface UseReportResult {
  data: ProductSummary | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch product data for a report page with optional server live-update refetch.
 * Refetches after SSE ticks stop while {@link shouldContinueLiveRefreshForProduct} is false (e.g. when analysis completes).
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
      liveUpdatesRefresh: true,
      shouldRefresh: (product) =>
        product !== null && shouldContinueLiveRefreshForProduct(product),
    }
  );

  return { data: data || null, loading, error };
}
