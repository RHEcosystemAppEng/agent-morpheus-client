/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Product } from '../models/Product';
import type { ReportData } from '../models/ReportData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductEndpointService {
    /**
     * List products
     * Retrieves a paginated list of reports grouped by product_id, filtered to only include reports with metadata.product_id, sorted by submittedAt, sbomName, or productId
     * @returns Product Products retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Products({
        cveId,
        page = 0,
        pageSize = 100,
        sbomName,
        sortDirection = 'DESC',
        sortField = 'submittedAt',
    }: {
        /**
         * Filter by CVE ID (case-insensitive partial match)
         */
        cveId?: string,
        /**
         * Page number (0-based)
         */
        page?: number,
        /**
         * Number of items per page
         */
        pageSize?: number,
        /**
         * Filter by SBOM name (case-insensitive partial match)
         */
        sbomName?: string,
        /**
         * Sort direction: 'ASC' or 'DESC'
         */
        sortDirection?: string,
        /**
         * Sort field: 'submittedAt', 'sbomName', or 'productId'
         */
        sortField?: string,
    }): CancelablePromise<Array<Product>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products',
            query: {
                'cveId': cveId,
                'page': page,
                'pageSize': pageSize,
                'sbomName': sbomName,
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
     * Accepts a multipart form with CVE ID and CycloneDX file, validates the file structure, creates a report with product ID, and queues it for analysis
     * @returns ReportData File uploaded and analysis request queued
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
                400: `Invalid request data (invalid CVE format, invalid JSON, missing required fields)`,
                429: `Request queue exceeded`,
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
         * Submitted at timestamp from first report's metadata.submitted_at
         */
        submittedAt?: string;
        /**
         * Number of reports in this product group
         */
        numReports: number;
        /**
         * MongoDB document _id (as hex string) of the first report in the group, always populated for navigation purposes
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
