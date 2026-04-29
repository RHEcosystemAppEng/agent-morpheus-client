/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * Report live-update stream (SSE)
     * Long-lived Server-Sent Events (media type text/event-stream). Each event's `data` line is JSON `{}` (empty object): report or product data may have changed. Use EventSource or another SSE-capable client with the same authentication as other /api/v1 routes. The TypeScript client generated from this specification does not implement streaming; keep using the generated client for REST and subscribe to this path manually.
     * @returns any Open stream of SSE events until the client disconnects or the server closes the connection.
     * @throws ApiError
     */
    public static getApiV1ReportsStream(): CancelablePromise<Record<string, never>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/stream',
            errors: {
                401: `Authentication required (missing or invalid JWT)`,
            },
        });
    }
}
