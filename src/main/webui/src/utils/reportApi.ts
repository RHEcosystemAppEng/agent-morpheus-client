/**
 * Typed wrapper functions for report API endpoints
 * These provide proper TypeScript types even when the OpenAPI spec
 * shows String return types for performance reasons.
 */

import type { FullReport } from '../types/FullReport';
import type { CancelablePromise } from '../generated-client';
import { ReportEndpointService } from '../generated-client/services/ReportEndpointService';

/**
 * Get Repository FullReport type isn't available in the generated client, since it's not defined in the Java code, so it's coded in the types/FullReport.ts file.
 * @param id - Report ID (24-character hexadecimal MongoDB ObjectId format)
 * @returns Promise resolving to FullReport
 */
export function getRepositoryReport(id: string): CancelablePromise<FullReport> {
  return ReportEndpointService.getApiV1Reports1({ id }) as any as CancelablePromise<FullReport>;
}

