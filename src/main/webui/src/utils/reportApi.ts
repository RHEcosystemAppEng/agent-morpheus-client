/**
 * Typed wrapper functions for report API endpoints
 * These provide proper TypeScript types even when the OpenAPI spec
 * shows String return types for performance reasons.
 */

import type { CancelablePromise, ReportWithStatus } from '../generated-client';
import { ReportEndpointService } from '../generated-client/services/ReportEndpointService';

/**
 * Get Repository report with status. The API returns a ReportWithStatusResponse with separate report and status fields.
 * @param id - Report ID (24-character hexadecimal MongoDB ObjectId format)
 * @returns Promise resolving to ReportWithStatusResponse
 */
export function getRepositoryReport(id: string): CancelablePromise<ReportWithStatus> {
  return ReportEndpointService.getApiV1Reports1({ id }) as any as CancelablePromise<ReportWithStatus>;
}

