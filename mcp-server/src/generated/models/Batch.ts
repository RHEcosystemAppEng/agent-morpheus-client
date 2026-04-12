/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchType } from './BatchType';
import type { LocalDateTime } from './LocalDateTime';
export type Batch = {
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
};

