/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GenerateSbomEndpointService {
    /**
     * Generate SBOM
     * Generates a Software Bill of Materials (SBOM) for a container image
     * @returns any SBOM generated successfully
     * @throws ApiError
     */
    public static postApiV1GenerateSbom({
        requestBody,
    }: {
        /**
         * Container image name and tag
         */
        requestBody: string,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/generate-sbom',
            body: requestBody,
            mediaType: 'text/plain',
            errors: {
                400: `Image has not been provided`,
                500: `Internal server error`,
            },
        });
    }
}
