/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Job } from '../models/Job';
import type { LocalDateTime } from '../models/LocalDateTime';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MlOpsAudit2JobResourceService {
    /**
     * Create List of new jobs containing metadata of executions of analysis
     * Creates multiple jobs containing audit metadata about analysis runs
     * @returns any jobs creation accepted
     * @throws ApiError
     */
    public static postApiV1Jobs({
        requestBody,
    }: {
        /**
         * Job Analysis run metadata
         */
        requestBody: Array<Job>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/jobs',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data in request body - validation error`,
                422: `Jobs objects are unprocessable - Cannot insert Job objects to DB due to existence of at least one batchId of a single job object that doesn't exists in batches DB`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete multiple analysis reports
     * Deletes multiple analysis job runs metadata by job ids
     * @returns any Reports deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Jobs({
        jobsIds,
    }: {
        /**
         * List of report IDs to delete (24-character hexadecimal MongoDB ObjectId format)
         */
        jobsIds?: Array<string>,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/jobs',
            query: {
                'jobsIds': jobsIds,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get job run data by jobId
     * Retrieves a specific job run metadata by job identifier(scan_id)
     * @returns any Job retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Jobs({
        jobId,
    }: {
        /**
         * Job ID to get (unique id (scan_id) of the job to be fetched )
         */
        jobId: string,
    }): CancelablePromise<{
        job_id?: string;
        execution_start_timestamp?: LocalDateTime;
        duration_in_seconds?: string;
        cve?: string;
        app_language?: string;
        component?: string;
        component_version?: string;
        agent_git_commit?: string;
        agent_git_tag?: string;
        agent_config_b64?: string;
        concrete_intel_sources_b64?: string;
        executed_from_background_process?: boolean;
        batch_id?: string;
        success_status?: boolean;
        /**
         * comma delimited key=value pairs
         */
        env_vars: string;
        job_output?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/jobs',
            query: {
                'jobId': jobId,
            },
            errors: {
                404: `Job not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get jobs documents containing metadata of analysis runs
     * Retrieves a list of audit metadata jobs documents by several filtering combinations, by batchId, by cveId, by cveId, componentName, componentVersion or all documents if none of the query-parameters are supplied
     * @returns Job Jobs retrieved successfully
     * @throws ApiError
     */
    public static getApiV1JobsAll({
        batchId = '',
        component = '',
        componentVersion = '',
        cveId = '',
    }: {
        /**
         * if supplied, fetch jobs documents of the given batchId'
         */
        batchId?: string,
        /**
         * If supplied, return jobs with the given Application name or project name which is inspected in the analysis run
         */
        component?: string,
        /**
         * If supplied, return jobs with the given Application version which is  inspected in the analysis run
         */
        componentVersion?: string,
        /**
         * If supplied, fetch jobs documents of analysis runs of the given vulnerability
         */
        cveId?: string,
    }): CancelablePromise<Array<Job>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/jobs/all',
            query: {
                'batchId': batchId,
                'component': component,
                'componentVersion': componentVersion,
                'cveId': cveId,
            },
            errors: {
                400: `Bad request - Wrong assignment of query parameters`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Create one job containing metadata of one execution of analysis
     * Creates 1 jobs audit data
     * @returns any job creation succeeded
     * @throws ApiError
     */
    public static postApiV1JobsOne({
        requestBody,
    }: {
        /**
         * Job Analysis run metadata
         */
        requestBody: Job,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/jobs/one',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data in request body - validation error`,
                422: `Job object is unprocessable - Cannot insert Job object to DB due to the fact that related batchId doesn't exists in DB`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete analysis job metadata
     * Deletes a specific analysis job metadata by Internal DB id
     * @returns any Report deletion request accepted
     * @throws ApiError
     */
    public static deleteApiV1Jobs1({
        id,
    }: {
        /**
         * job id to delete (unique scan_id identifier of the analysis run)
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/jobs/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get job run data
     * Retrieves a specific job run data by internal DB Id
     * @returns any Job retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Jobs1({
        id,
    }: {
        /**
         * Job ID to get (24-character hexadecimal MongoDB ObjectId format)
         */
        id: string,
    }): CancelablePromise<{
        job_id?: string;
        execution_start_timestamp?: LocalDateTime;
        duration_in_seconds?: string;
        cve?: string;
        app_language?: string;
        component?: string;
        component_version?: string;
        agent_git_commit?: string;
        agent_git_tag?: string;
        agent_config_b64?: string;
        concrete_intel_sources_b64?: string;
        executed_from_background_process?: boolean;
        batch_id?: string;
        success_status?: boolean;
        /**
         * comma delimited key=value pairs
         */
        env_vars: string;
        job_output?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/jobs/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Job not found`,
                500: `Internal server error`,
            },
        });
    }
}
