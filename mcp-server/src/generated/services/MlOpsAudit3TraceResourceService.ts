/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Trace } from '../models/Trace';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MlOpsAudit3TraceResourceService {
    /**
     * Create List of new traces/spans metrics data of certain stages in certain analysis job runs
     * Creates multiple traces and spans containing telemetry data about certain analysis job runs
     * @returns any traces creation accepted
     * @throws ApiError
     */
    public static postApiV1Traces({
        requestBody,
        bypassReferentialIntegrityCheck,
    }: {
        /**
         * span data of a certain unit of work/function inside a LLM Stage of single job Analysis run
         */
        requestBody: Array<Trace>,
        bypassReferentialIntegrityCheck?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/traces',
            headers: {
                'Bypass-Referential-Integrity-Check': bypassReferentialIntegrityCheck,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data in request body - validation error`,
                422: `Traces objects are unprocessable - Cannot insert Traces objects to DB due to existence of at least one jobId that doesn't exists in DB`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get trace + spans data documents containing telemetry data of all stages inside agent job runs
     * Retrieves a list of trace+span documentsby several filtering combinations, by jobId ( all traces and spans of a single job id), by traceId ( all spans of a particular traceId/Pipeline Stageor all eval documents if none of the query-parameters are supplied
     * @returns Trace Traces retrieved successfully
     * @throws ApiError
     */
    public static getApiV1TracesAll({
        jobId = '',
        traceId = '',
    }: {
        /**
         * If supplied , fetch trace documents of analysis runs of the given jobId
         */
        jobId?: string,
        /**
         * If supplied, returns only traces document of analysis run for a given traceId ( only one stage at the job pipeline)
         */
        traceId?: string,
    }): CancelablePromise<Array<Trace>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/traces/all',
            query: {
                'jobId': jobId,
                'traceId': traceId,
            },
            errors: {
                400: `Bad request - Wrong assignment of query parameters`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete all traces and spans data of a certain jobId
     * Deletes a specific job traces and spans by jobId and optional traceId ( to delete only one agent stage spans
     * @returns any Report deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Traces({
        jobId,
        traceId,
    }: {
        /**
         * job id to delete its traces (unique scan_id identifier of the analysis run)
         */
        jobId: string,
        /**
         * If supplied, trace_id to delete only spans of one agent/llm stage
         */
        traceId?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/traces/{jobId}',
            path: {
                'jobId': jobId,
            },
            query: {
                'traceId': traceId,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
