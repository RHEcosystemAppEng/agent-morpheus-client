/**
 * Authenticated SSE URL (same app origin) for server-driven “data may have changed” signals.
 * Each event body is JSON `{}` until the contract adds fields for targeted invalidation.
 */
export const REPORTS_LIVE_UPDATES_SSE_PATH = "/api/v1/reports/stream";
