/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Eval } from '../models/Eval';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MlOpsAudit4EvalResourceService {
    /**
     * Create List of new evals metrics data of certain stages in certain analysis job runs
     * Creates multiple jobs containing audit metadata about analysis runs
     * @returns any jobs creation accepted
     * @throws ApiError
     */
    public static postApiV1Evals({
        requestBody,
    }: {
        /**
         * Eval Metric data of a certain LLM Stage of single Analysis run
         */
        requestBody: Array<Eval>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/evals',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data in request body - validation error`,
                422: `Evals objects are unprocessable - Cannot insert Evals objects to DB due to existence of at least one jobId that doesn't exists in DB`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get eval metrics data documents containing metrics score of llm stages in
     * Retrieves a list of eval metrics documents with data and scores of llm stages in jobs runs by several filtering combinations, by jobId, by traceId,or all eval documents if none of the query-parameters are supplied
     * @returns Eval Evals retrieved successfully
     * @throws ApiError
     */
    public static getApiV1EvalsAll({
        jobId = '',
        traceId = '',
    }: {
        /**
         * If supplied , fetch eval metrics documents of analysis runs of the given jobId
         */
        jobId?: string,
        /**
         * If supplied, returns only eval metrics of analysis run for a given traceId ( only one stage at the job pipeline)
         */
        traceId?: string,
    }): CancelablePromise<Array<Eval>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/evals/all',
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
     * Get all eval metrics data documents containing metrics score of all jobs runs and all their llm stages for a given application version and vulnerability combination
     * Retrieves a list of audit metadata jobs documents by several filtering combinations, by jobId, by traceId,or all documents if none of the query-parameters are supplied
     * @returns Eval Jobs retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Evals({
        cveId,
        component = '',
        componentVersion = '',
        metricName = '',
    }: {
        cveId: string,
        /**
         * If supplied, return all  with the given Application name or project name which is inspected in the analysis run
         */
        component?: string,
        /**
         * If supplied, return jobs with the given Application version which is  inspected in the analysis run
         */
        componentVersion?: string,
        /**
         * If supplied, return only evals data documents of the specific metric name
         */
        metricName?: string,
    }): CancelablePromise<Array<Eval>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/evals/{cveId}',
            path: {
                'cveId': cveId,
            },
            query: {
                'component': component,
                'componentVersion': componentVersion,
                'metricName': metricName,
            },
            errors: {
                400: `Bad request - Wrong assignment of query parameters`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete all eval metrics data of a certain jobId, or metadata
     * Deletes a specific analysis job metadata by jobId and optional traceId
     * @returns any Report deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Evals({
        jobId,
        traceId,
    }: {
        /**
         * job id to delete its evals (unique scan_id identifier of the analysis run)
         */
        jobId: string,
        /**
         * If supplied, trace_id to delete only metrics of one llm stage
         */
        traceId?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/evals/{jobId}',
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
