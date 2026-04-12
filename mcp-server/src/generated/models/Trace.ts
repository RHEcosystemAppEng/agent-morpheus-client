/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalDateTime } from './LocalDateTime';
export type Trace = {
    readonly format_version?: number;
    /**
     * The job run id in which the trace and spans were instrumented
     */
    job_id: string;
    execution_start_timestamp?: LocalDateTime;
    /**
     * The id corresponding to one agent stage, grouping underneath all spans of sub-tasks embedded in the agent stage
     */
    trace_id: string;
    /**
     * The id corresponding to one sub task inside one agent stage.
     */
    span_id: string;
    /**
     * free style span payload without restrictions, containing all span metadata and istrumentation data
     */
    span_payload?: Record<string, any>;
};

