/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportSseMessage } from '../models/ReportSseMessage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportStreamResourceService {
    /**
     * Report live-update stream (SSE)
     * Server-Sent Events. Each event `data` line is JSON `{}` (empty object): report or product data may have changed; clients should refetch their REST views. The payload may gain fields later for targeted invalidation.
     * @returns ReportSseMessage SSE stream
     * @throws ApiError
     */
    public static getApiV1ReportsStream(): CancelablePromise<ReportSseMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/stream',
        });
    }
}
