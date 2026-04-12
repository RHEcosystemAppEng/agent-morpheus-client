/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Feedback } from '../models/Feedback';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FeedbackResourceService {
    /**
     * Submit user feedback for an AI response
     * Submits user feedback for an AI response to the feedback service
     * @returns any Feedback successfully processed
     * @throws ApiError
     */
    public static postApiV1Feedback({
        requestBody,
    }: {
        /**
         * User feedback data
         */
        requestBody: Feedback,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/feedback',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Check if feedback exists for a report
     * Checks if feedback has been submitted for a specific report
     * @returns any Feedback existence status retrieved successfully
     * @throws ApiError
     */
    public static getApiV1FeedbackExists({
        reportId,
    }: {
        /**
         * Report identifier
         */
        reportId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/feedback/{reportId}/exists',
            path: {
                'reportId': reportId,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
