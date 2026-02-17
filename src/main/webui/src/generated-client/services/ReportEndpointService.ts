/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FailedComponent } from '../models/FailedComponent';
import type { ProductSummary } from '../models/ProductSummary';
import type { Report } from '../models/Report';
import type { ReportData } from '../models/ReportData';
import type { ReportRequest } from '../models/ReportRequest';
import type { ReportRequestId } from '../models/ReportRequestId';
import type { ReportWithStatus } from '../models/ReportWithStatus';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportEndpointService {
    /**
     * Delete multiple analysis reports
     * Deletes multiple analysis reports by IDs or using filter parameters
     * @returns any Reports deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Reports({
        reportIds,
    }: {
        /**
         * List of report IDs to delete (24-character hexadecimal MongoDB ObjectId format)
         */
        reportIds?: Array<string>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/reports',
            query: {
                'reportIds': reportIds,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Receive analysis report
     * Receives a completed analysis report from Morpheus
     * @returns ReportRequestId Report received
     * @throws ApiError
     */
    public static postApiV1Reports({
        requestBody,
    }: {
        requestBody: string,
    }): CancelablePromise<ReportRequestId> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reports',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * List analysis reports
     * Retrieves a paginated list of analysis reports with optional filtering and sorting
     * @returns Report Reports retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Reports({
        exploitIqStatus,
        imageName,
        imageTag,
        page = 0,
        pageSize = 100,
        productId,
        reportId,
        sortBy,
        status,
        vulnId,
    }: {
        /**
         * Filter by ExploitIQ status. Valid values: TRUE, FALSE, UNKNOWN
         */
        exploitIqStatus?: string,
        /**
         * Filter by image name
         */
        imageName?: string,
        /**
         * Filter by image tag
         */
        imageTag?: string,
        /**
         * Page number (0-based)
         */
        page?: number,
        /**
         * Number of items per page
         */
        pageSize?: number,
        /**
         * Filter by SBOM report ID (metadata.product_id)
         */
        productId?: string,
        /**
         * Filter by report ID (input.scan.id)
         */
        reportId?: string,
        /**
         * Sort criteria in format 'field:direction'
         */
        sortBy?: Array<string>,
        /**
         * Filter by status. Valid values: completed, sent, failed, queued, expired, pending
         */
        status?: string,
        /**
         * Filter by vulnerability ID (CVE ID)
         */
        vulnId?: string,
    }): CancelablePromise<Array<Report>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports',
            query: {
                'exploitIqStatus': exploitIqStatus,
                'imageName': imageName,
                'imageTag': imageTag,
                'page': page,
                'pageSize': pageSize,
                'productId': productId,
                'reportId': reportId,
                'sortBy': sortBy,
                'status': status,
                'vulnId': vulnId,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Create new analysis request
     * Creates a new analysis report request, processes it and optionally submits it to ExploitIQ for analysis
     * @returns ReportData Analysis request accepted
     * @throws ApiError
     */
    public static postApiV1ReportsNew({
        requestBody,
        submit = true,
    }: {
        /**
         * Analysis report request data
         */
        requestBody: ReportRequest,
        /**
         * Whether to submit to ExploitIQ for analysis
         */
        submit?: boolean,
    }): CancelablePromise<ReportData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reports/new',
            query: {
                'submit': submit,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data`,
                429: `Request queue exceeded`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete product by IDs
     * Deletes all component analysis reports and product metadata associated with specified product IDs
     * @returns any Product deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1ReportsProduct({
        productIds,
    }: {
        /**
         * List of product IDs to delete
         */
        productIds: Array<string>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/reports/product',
            query: {
                'productIds': productIds,
            },
            errors: {
                400: `Invalid request - no product IDs provided`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * List all product data
     * Retrieves paginated, sortable, and filterable product data for all products
     * @returns ProductSummary Product data retrieved successfully
     * @throws ApiError
     */
    public static getApiV1ReportsProduct({
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
            url: '/api/v1/reports/product',
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
     * Delete product by ID
     * Deletes all component analysis reports and product metadata associated with a specific product ID
     * @returns any Product deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1ReportsProduct1({
        id,
    }: {
        /**
         * Product ID to delete
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/reports/product/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get product data by ID
     * Retrieves product data for a specific product ID
     * @returns any Product data retrieved successfully
     * @throws ApiError
     */
    public static getApiV1ReportsProduct1({
        id,
    }: {
        /**
         * Product ID
         */
        id: string,
    }): CancelablePromise<{
        /**
         * Product data
         */
        data: {
            /**
             * Product ID
             */
            id: string;
            /**
             * Product name
             */
            name: string;
            /**
             * Product version
             */
            version: string;
            /**
             * Timestamp of product scan request submission
             */
            submittedAt: string;
            /**
             * Number of components submitted for scanning
             */
            submittedCount: number;
            /**
             * Product user provided metadata
             */
            metadata: Record<string, string>;
            /**
             * List of submitted components failed to be processed for scanning
             */
            submissionFailures: Array<FailedComponent>;
            /**
             * Timestamp of product scan request completion
             */
            completedAt?: string;
            /**
             * CVE ID associated with this product
             */
            cveId: string;
        };
        /**
         * Product reports summary data
         */
        summary: {
            /**
             * Product state of analysis
             */
            productState: string;
            /**
             * Map of analysis state to count of reports with that state
             */
            statusCounts: Record<string, number>;
            /**
             * Map of justification status to count of reports with that status
             */
            justificationStatusCounts: Record<string, number>;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/product/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete analysis report
     * Deletes a specific analysis report by ID
     * @returns any Report deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Reports1({
        id,
    }: {
        /**
         * Report ID to delete (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/reports/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get analysis report
     * Retrieves a specific analysis report by ID with calculated analysis status
     * @returns ReportWithStatus Report retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Reports1({
        id,
    }: {
        /**
         * Report ID to get (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<ReportWithStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Report not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Mark analysis request as failed
     * Marks an analysis request as failed with error details
     * @returns string Failure status record accepted
     * @throws ApiError
     */
    public static postApiV1ReportsFailed({
        id,
        errorMessage,
    }: {
        /**
         * Report ID to mark as failed (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
        /**
         * Error message describing the failure
         */
        errorMessage: string,
    }): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reports/{id}/failed',
            path: {
                'id': id,
            },
            query: {
                'errorMessage': errorMessage,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Retry analysis request
     * Retries an existing analysis request by ID
     * @returns string Retry request accepted
     * @throws ApiError
     */
    public static postApiV1ReportsRetry({
        id,
    }: {
        /**
         * Report ID to retry (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reports/{id}/retry',
            path: {
                'id': id,
            },
            errors: {
                404: `Request not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Submit to ExploitIQ for analysis
     * Submits analysis request to ExploitIQ for analysis
     * @returns string Request submitted successfully
     * @throws ApiError
     */
    public static postApiV1ReportsSubmit({
        id,
    }: {
        /**
         * Request payload (report) ID to submit (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reports/{id}/submit',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid request data`,
                404: `Request payload not found`,
                429: `Request queue exceeded`,
                500: `Internal server error`,
            },
        });
    }
}
