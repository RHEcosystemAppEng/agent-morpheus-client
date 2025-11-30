/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeedbackDto } from '../models/FeedbackDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FeedbackResourceService {
    /**
     * Forward To User Feedback Service
     * @returns any OK
     * @throws ApiError
     */
    public static postApiFeedback({
        requestBody,
    }: {
        requestBody: FeedbackDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/feedback',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Check Feedback Exists
     * @returns any OK
     * @throws ApiError
     */
    public static getApiFeedbackExists({
        reportId,
    }: {
        reportId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feedback/{reportId}/exists',
            path: {
                'reportId': reportId,
            },
        });
    }
}
