/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductSummary } from '../models/ProductSummary';
import type { ReportData } from '../models/ReportData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductEndpointService {
    /**
     * List all product data
     * Retrieves paginated, sortable, and filterable product data for all products
     * @returns ProductSummary Product data retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Products({
        cveId,
        name,
        page = 0,
        pageSize = 100,
        sortDirection = 'DESC',
        sortField = 'submittedAt',
    }: {
        cveId?: string,
        name?: string,
        page?: number,
        pageSize?: number,
        sortDirection?: string,
        sortField?: string,
    }): CancelablePromise<Array<ProductSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products',
            query: {
                'cveId': cveId,
                'name': name,
                'page': page,
                'pageSize': pageSize,
                'sortDirection': sortDirection,
                'sortField': sortField,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
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
    /**
     * Remove
     * @returns any Product deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Products({
        id,
    }: {
        /**
         * Product ID
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/products/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get product
     * Gets product by ID from database
     * @returns ProductSummary Product found in database
     * @throws ApiError
     */
    public static getApiV1Products1({
        id,
    }: {
        /**
         * Product ID
         */
        id: string,
    }): CancelablePromise<ProductSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Product not found in database`,
                500: `Internal server error`,
            },
        });
    }
}
