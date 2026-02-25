/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Batch } from '../models/Batch';
import type { BatchType } from '../models/BatchType';
import type { Job } from '../models/Job';
import type { LocalDateTime } from '../models/LocalDateTime';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MlOpsAudit1BatchResourceService {
    /**
     * Create one Batch containing metadata of multiple analysis jobs runs
     * Creates 1 batch audit data
     * @returns any Batch creation succeeded
     * @throws ApiError
     */
    public static postApiV1Batch({
        requestBody,
    }: {
        /**
         * Batch of jobs analysis runs metadata
         */
        requestBody: Batch,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/batch',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data in request body - validation error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Batch documents containing metadata of jobs analysis runs
     * Retrieves a list of audit metadata Batches documents by several filtering combinations, by specific Language or not (mixed batch languages), or just all batches regardless of the languageor all documents if none of the query-parameters are supplied
     * @returns Job Batches retrieved successfully
     * @throws ApiError
     */
    public static getApiV1BatchAll({
        language = '',
    }: {
        /**
         * if supplied, fetch batches documents of the given language or mixed languages batches documents
         */
        language?: string,
    }): CancelablePromise<Array<Job>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/batch/all',
            query: {
                'language': language,
            },
            errors: {
                400: `Bad request - Wrong assignment of query parameters`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get recent batch run metadata of batch based on specific language or mixed languages batches.
     * Retrieves the most recent batch run metadata according to specific language or not
     * @returns any Batch retrieved successfully
     * @throws ApiError
     */
    public static getApiV1BatchLatest({
        batchType,
        language,
    }: {
        /**
         * the Batch type of the batch run, for returning the recent batch run of mixed languages batches
         */
        batchType: BatchType,
        /**
         * the language of the batch run, for returning the recent batch run of mixed languages batches, pass 'all'
         */
        language: string,
    }): CancelablePromise<{
        batch_id?: string;
        execution_start_timestamp?: LocalDateTime;
        execution_end_timestamp?: LocalDateTime;
        batch_type?: BatchType;
        app_language?: string;
        duration?: string;
        total_number_of_executed_jobs?: number;
        agent_git_commit: string;
        agent_git_tag: string;
        agent_config_b64: string;
        /**
         * comma delimited key=value pairs
         */
        env_vars: string;
        confusion_matrix_accuracy?: number;
        confusion_matrix_precision?: number;
        confusion_matrix_f1_score?: number;
        confusion_matrix_recall?: number;
        total_number_of_failures?: number;
        regressive_jobs_ids: Array<string>;
        number_of_regressive_jobs_ids?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/batch/latest',
            query: {
                'batch_type': batchType,
                'language': language,
            },
            errors: {
                404: `Batch not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete batch document metadata
     * Deletes a specific batch of jobs analysis runs metadata by Internal DB id
     * @returns any Batch deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Batch({
        id,
    }: {
        /**
         * Batch id to delete (unique batch identifier of the multiple jobs analysis runs )
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/batch/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Batch of jobs run metadata
     * Retrieves a specific batch of jobs runs metadata by batchId
     * @returns any Batch retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Batch({
        id,
    }: {
        /**
         * Batch ID to get
         */
        id: string,
    }): CancelablePromise<{
        batch_id?: string;
        execution_start_timestamp?: LocalDateTime;
        execution_end_timestamp?: LocalDateTime;
        batch_type?: BatchType;
        app_language?: string;
        duration?: string;
        total_number_of_executed_jobs?: number;
        agent_git_commit: string;
        agent_git_tag: string;
        agent_config_b64: string;
        /**
         * comma delimited key=value pairs
         */
        env_vars: string;
        confusion_matrix_accuracy?: number;
        confusion_matrix_precision?: number;
        confusion_matrix_f1_score?: number;
        confusion_matrix_recall?: number;
        total_number_of_failures?: number;
        regressive_jobs_ids: Array<string>;
        number_of_regressive_jobs_ids?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/batch/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Batch not found`,
                500: `Internal server error`,
            },
        });
    }
}
