/**
 * Shared utilities for live refresh (SSE) stop conditions on report pages.
 */

import { ProductSummary } from "../generated-client";

/**
 * Pure function to determine if live refresh should continue based on statusCounts.
 * Returns true if there are any analysis states that are not "failed" or "completed".
 * 
 * @param statusCounts - Record mapping state names to counts
 * @returns true if polling should continue, false otherwise
 */
export function shouldContinuePollingByProductState(
  product: ProductSummary
): boolean {
  return product.summary.productState !== "completed";
}

