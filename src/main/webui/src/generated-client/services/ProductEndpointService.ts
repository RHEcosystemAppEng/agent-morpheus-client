/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportData } from '../models/ReportData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductEndpointService {
    /**
     * Upload CycloneDX file for analysis
     * Accepts a CVE ID and CycloneDX JSON file, validates them, and queues the report for analysis
     * @returns ReportData File uploaded and queued for analysis
     * @throws ApiError
     */
    public static postApiV1ProductsUploadCyclonedx({
        formData,
    }: {
        formData: {
            cveId?: string;
            file?: Blob;
        },
    }): CancelablePromise<ReportData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/products/upload-cyclonedx',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Validation error with field-specific error messages`,
                500: `Internal server error`,
            },
        });
    }
}
