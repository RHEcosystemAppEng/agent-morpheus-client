/**
 * Shared constants and utilities for polling/auto-refresh functionality
 */

import { ProductSummary } from "../generated-client";

/**
 * Default polling interval for auto-refresh (5 seconds)
 * Used for report pages and repository reports tables
 */
export const POLL_INTERVAL_MS = 5000;

/**
 * Polling interval for reports table (15 seconds)
 * Used for the main reports table which shows aggregated product data
 */
export const REPORTS_TABLE_POLL_INTERVAL_MS = 15000;

/**
 * Pure function to determine if polling should continue based on statusCounts.
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

