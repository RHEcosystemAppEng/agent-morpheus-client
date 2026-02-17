/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OverviewMetrics } from '../models/OverviewMetrics';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OverviewMetricsService {
    /**
     * Get overview metrics
     * Retrieves metrics for the home page calculated from data in the last week, including count of successfully analyzed reports, average reliability score, and false positive rate
     * @returns OverviewMetrics Overview metrics retrieved successfully
     * @throws ApiError
     */
    public static getApiV1OverviewMetrics(): CancelablePromise<OverviewMetrics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/overview-metrics',
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
