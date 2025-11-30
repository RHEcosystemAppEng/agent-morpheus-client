/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FailedComponent } from '../models/FailedComponent';
import type { Justification } from '../models/Justification';
import type { ProductSummary } from '../models/ProductSummary';
import type { Report } from '../models/Report';
import type { ReportData } from '../models/ReportData';
import type { ReportRequest } from '../models/ReportRequest';
import type { ReportRequestId } from '../models/ReportRequestId';
import type { ReportsSummary } from '../models/ReportsSummary';
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
    public static deleteApiReports({
        reportIds,
    }: {
        /**
         * List of report IDs to delete (24-character hexadecimal MongoDB ObjectId format)
         */
        reportIds?: Array<string>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports',
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
    public static postApiReports({
        requestBody,
    }: {
        requestBody: string,
    }): CancelablePromise<ReportRequestId> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports',
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
    public static getApiReports({
        page = 0,
        pageSize = 100,
        sortBy,
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
         * Sort criteria in format 'field:direction'
         */
        sortBy?: Array<string>,
    }): CancelablePromise<Array<Report>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
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
    public static postApiReportsNew({
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
            url: '/api/reports/new',
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
    public static deleteApiReportsProduct({
        productIds,
    }: {
        /**
         * List of product IDs to delete
         */
        productIds: Array<string>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/product',
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
     * Retrieves product data for all products
     * @returns ProductSummary Product data retrieved successfully
     * @throws ApiError
     */
    public static getApiReportsProduct(): CancelablePromise<Array<ProductSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/product',
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
    public static deleteApiReportsProduct1({
        id,
    }: {
        /**
         * Product ID to delete
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/product/{id}',
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
    public static getApiReportsProduct1({
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
             * List of Component analysis states
             */
            componentStates: Array<string>;
            /**
             * Map of CVE vulnerabilities and their justifications
             */
            cves: Record<string, Array<Justification>>;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/product/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get reports summary
     * Retrieves summary statistics of reports including vulnerable/non-vulnerable counts, pending requests, and new reports today
     * @returns ReportsSummary Reports summary retrieved successfully
     * @throws ApiError
     */
    public static getApiReportsSummary(): CancelablePromise<ReportsSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/summary',
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
    public static deleteApiReports1({
        id,
    }: {
        /**
         * Report ID to delete (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/{id}',
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
     * Retrieves a specific analysis report by ID
     * @returns string Report retrieved successfully
     * @throws ApiError
     */
    public static getApiReports1({
        id,
    }: {
        /**
         * Report ID to get (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/{id}',
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
    public static postApiReportsFailed({
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
            url: '/api/reports/{id}/failed',
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
    public static postApiReportsRetry({
        id,
    }: {
        /**
         * Report ID to retry (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/{id}/retry',
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
    public static postApiReportsSubmit({
        id,
    }: {
        /**
         * Request payload (report) ID to submit (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/{id}/submit',
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
