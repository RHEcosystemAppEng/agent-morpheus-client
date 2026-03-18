/**
 * Typed wrapper functions for report API endpoints
 * These provide proper TypeScript types even when the OpenAPI spec
 * shows String return types for performance reasons.
 */

import type { CancelablePromise, ReportWithStatus } from '../generated-client';
import { ReportEndpointService } from '../generated-client/services/ReportEndpointService';

/**
 * Get repository report by scan ID (input.scan.id). Use when the URL reportId param is the scan ID.
 * @param scanId - Scan ID (input.scan.id) of the report
 * @returns Promise resolving to ReportWithStatus
 */
export function getRepositoryReport(scanId: string): CancelablePromise<ReportWithStatus> {
  return ReportEndpointService.getApiV1ReportsByScanId({ scanId }) as CancelablePromise<ReportWithStatus>;
}

