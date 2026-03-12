/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMStage } from './LLMStage';
import type { LocalDateTime } from './LocalDateTime';
import type { MetricName } from './MetricName';
export type Eval = {
    job_id: string;
    execution_start_timestamp?: LocalDateTime;
    trace_id?: string;
    cve: string;
    component: string;
    component_version: string;
    llm_node?: LLMStage;
    metric_name?: MetricName;
    metric_score: string;
    /**
     * Containing the reasoning for the score that was calculated
     */
    metric_reasoning?: string;
    /**
     * Containing the concrete Input to the agent model That is being evaluated
     */
    model_input?: string;
    /**
     * Containing the concrete Output produced by the Agent' Model which is being evaluated
     */
    model_output?: string;
};

