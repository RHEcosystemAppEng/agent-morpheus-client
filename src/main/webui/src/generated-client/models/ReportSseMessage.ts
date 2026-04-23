/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * JSON object sent as each SSE event data line (OpenAPI lists this under text/event-stream, not as a typical fetch response body).
 */
export type ReportSseMessage = {
    /**
     * Invalidation kind; use `catalog` for any list-affecting report or product change.
     */
    type: string;
    /**
     * Report id hint when applicable
     */
    reportId?: string;
    /**
     * Product id hint when applicable
     */
    productId?: string;
};

