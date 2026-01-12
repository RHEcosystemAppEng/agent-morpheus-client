/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Product } from '../models/Product';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductEndpointService {
    /**
     * Save product
     * Saves product metadata to database
     * @returns any Save product metadata request accepted
     * @throws ApiError
     */
    public static postApiV1Product({
        requestBody,
    }: {
        /**
         * Product metadata to save
         */
        requestBody: Product,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/product',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Create new product from SPDX SBOM
     * Uploads an SPDX SBOM file, parses it, creates a product, and starts async processing. Requires a vulnerability ID to include in all component reports.
     * @returns any Product creation request accepted
     * @throws ApiError
     */
    public static postApiV1ProductNew({
        vulnerabilityId,
        formData,
    }: {
        /**
         * Vulnerability ID (e.g., CVE-2024-12345) to include in all component reports
         */
        vulnerabilityId: string,
        formData: {
            file?: Blob;
        },
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/product/new',
            query: {
                'vulnerabilityId': vulnerabilityId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid SPDX file, missing required data, or missing vulnerability ID`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Remove
     * @returns any Product deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Product({
        id,
    }: {
        /**
         * Product ID
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/product/{id}',
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
     * @returns Product Product found in database
     * @throws ApiError
     */
    public static getApiV1Product({
        id,
    }: {
        /**
         * Product ID
         */
        id: string,
    }): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/product/{id}',
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
