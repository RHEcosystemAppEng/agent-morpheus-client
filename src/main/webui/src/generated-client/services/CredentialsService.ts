/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CredentialData } from '../models/CredentialData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CredentialsService {
    /**
     * Retrieve credential for ExploitIQ Agent
     * Single-use retrieval of decrypted credential. Credential is deleted after retrieval.
     * @returns CredentialData Credential retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Credentials({
        credentialId,
    }: {
        credentialId: string,
    }): CancelablePromise<CredentialData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/credentials/{credentialId}',
            path: {
                'credentialId': credentialId,
            },
            errors: {
                400: `Invalid credentialId format`,
                401: `Authentication required (missing or invalid JWT)`,
                404: `Credential not found or expired`,
                500: `Internal server error`,
            },
        });
    }
}
