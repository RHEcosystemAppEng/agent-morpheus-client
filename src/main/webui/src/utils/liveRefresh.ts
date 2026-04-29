/**
 * Stop conditions for SSE-driven REST refetches on report pages.
 */

import { ProductSummary } from "../generated-client";

/**
 * Whether live-update–driven refetches should continue for this product summary.
 * Returns false once repository analysis has finished (`productState === "completed"`).
 */
export function shouldContinueLiveRefreshForProduct(product: ProductSummary): boolean {
  return product.summary.productState !== "completed";
}
