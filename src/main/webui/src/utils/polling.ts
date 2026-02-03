/**
 * Shared constants and utilities for polling/auto-refresh functionality
 */

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
export function shouldContinuePollingByStatusCounts(
  statusCounts: Record<string, number> | null | undefined
): boolean {
  if (!statusCounts) {
    return true; // Continue polling if no data yet
  }
  
  const states = Object.keys(statusCounts);
  // Check if there are any states that are not "failed" or "completed"
  return states.some(
    (state) => state !== "failed" && state !== "completed" && (statusCounts[state] || 0) > 0
  );
}

