/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalDateTime } from './LocalDateTime';
export type Job = {
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
};

