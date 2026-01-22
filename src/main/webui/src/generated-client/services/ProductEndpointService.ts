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
     * List products
     * Retrieves a paginated list of products grouped by product_id, filtered to only include reports with metadata.product_id, sorted by completedAt or sbomName
     * @returns Product Products retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Products({
        page = 0,
        pageSize = 100,
        sortDirection = 'DESC',
        sortField = 'completedAt',
    }: {
        /**
         * Page number (0-based)
         */
        page?: number,
        /**
         * Number of items per page
         */
        pageSize?: number,
        /**
         * Sort direction: 'ASC' or 'DESC'
         */
        sortDirection?: string,
        /**
         * Sort field: 'completedAt' or 'sbomName'
         */
        sortField?: string,
    }): CancelablePromise<Array<Product>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products',
            query: {
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
     * Get product by ID
     * Retrieves product data for a specific product ID
     * @returns any Product retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Products1({
        productId,
    }: {
        /**
         * Product ID
         */
        productId: string,
    }): CancelablePromise<{
        /**
         * SBOM name from first report's metadata.sbom_name
         */
        sbomName?: string;
        /**
         * Product ID from first report's metadata.product_id
         */
        productId: string;
        /**
         * CVE ID from first report's input.scan.vulns[0].vuln_id
         */
        cveId?: string;
        /**
         * Map of CVE status to count of reports with that status
         */
        cveStatusCounts: Record<string, number>;
        /**
         * Map of report status to count of reports with that status
         */
        statusCounts: Record<string, number>;
        /**
         * Completed at timestamp - empty if any report's completed_at is empty, otherwise latest value
         */
        completedAt?: string;
        /**
         * Number of reports in this product group
         */
        numReports: number;
        /**
         * Report ID from the first report in the group, always populated for navigation purposes
         */
        firstReportId?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/{productId}',
            path: {
                'productId': productId,
            },
            errors: {
                404: `Product not found`,
                500: `Internal server error`,
            },
        });
    }
}
