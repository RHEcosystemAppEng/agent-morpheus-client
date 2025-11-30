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
    public static postApiProduct({
        requestBody,
    }: {
        /**
         * Product metadata to save
         */
        requestBody: Product,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/product',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Remove
     * @returns any Product deletion request accepted
     * @throws ApiError
     */
    public static deleteApiProduct({
        id,
    }: {
        /**
         * Product ID
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/product/{id}',
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
    public static getApiProduct({
        id,
    }: {
        /**
         * Product ID
         */
        id: string,
    }): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/product/{id}',
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
