/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Inline credential for private repository access
 */
export type InlineCredential = {
    /**
     * The secret value to be encrypted and stored
     */
    secretValue: string;
    /**
     * Git username (required for PAT authentication, ignored for SSH keys)
     */
    username?: string;
};

