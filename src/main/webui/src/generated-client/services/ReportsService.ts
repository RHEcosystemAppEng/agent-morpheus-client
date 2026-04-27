/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * Report catalog change stream (SSE)
     * Long-lived Server-Sent Events (media type text/event-stream). Each event's `data` field is JSON matching ReportSseMessage. This is not a typical OpenAPI fetch-style JSON response: use EventSource or another SSE-capable client with the same authentication as other /api/v1 routes. The TypeScript client generated from this specification does not implement streaming; keep using the generated client for REST and subscribe to this path manually. Events use type `catalog` when report or product data that affects lists changes; clients should refetch their current REST queries.
     * @returns any Open stream of SSE events until the client disconnects or the server closes the connection.
     * @throws ApiError
     */
    public static getApiV1ReportsStream(): CancelablePromise<{
        /**
         * Invalidation kind; use `catalog` for any list-affecting report or product change.
         */
        type: string;
        /**
         * Report id hint when applicable
         */
        reportId?: string;
        /**
         * Product id hint when applicable
         */
        productId?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/stream',
            errors: {
                401: `Authentication required (missing or invalid JWT)`,
            },
        });
    }
}
