/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * JSON object sent as each SSE event `data` line (OpenAPI lists this under text/event-stream).
 * Today this is the empty object `{}`: any message means data may have changed; refetch REST as needed.
 * Future OpenAPI versions may add optional properties for targeted invalidation.
 */
export type ReportSseMessage = Record<string, never>;
