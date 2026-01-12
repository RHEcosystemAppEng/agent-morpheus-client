/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportData } from '../models/ReportData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PreProcessingEndpointService {
    /**
     * Submit report requests for pre-processing
     * Submits a list of report requests for pre-processing to the Component Syncer
     * @returns any Pre-processing request accepted by the Component Syncer
     * @throws ApiError
     */
    public static postApiV1PreProcessing({
        requestBody,
    }: {
        /**
         * List of report requests for pre-processing
         */
        requestBody: Array<ReportData>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/pre-processing',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal server error`,
            },
        });
    }
}
