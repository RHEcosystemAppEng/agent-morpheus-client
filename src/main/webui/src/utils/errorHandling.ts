// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Error handling and loading state management utilities
 */

import { ApiError } from "../generated-client";
import type { ValidationErrorResponse } from "../generated-client/models/ValidationErrorResponse";


/**
 * User-friendly error message formatter for API errors
 * @param error The error to format
 * @param defaultMessage Default message to use if error cannot be parsed (default: "An error occurred")
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown, defaultMessage: string = "An error occurred"): string {
  // Handle ApiError instances with specific status codes
  if (error instanceof ApiError && "error" in error.body && typeof error.body.error === "string") {
    return error.body.error;
  }
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Request queue exceeded. Please try again later.";
    }
    if (error.status === 500) {
      return "An internal server error occurred. Please try again later.";
    }
    if (error.status === 404) {
      return "The requested resource was not found.";
    }
    if (error.status === 403) {
      return "You do not have permission to access this resource.";
    }
    if (error.status === 401) {
      return "Authentication required. Please log in.";
    }
    if (error.status === 0) {
      return "Network error. Please check your connection and try again.";
    }
    
    return error.message || defaultMessage;
  }
  
  // Handle generic Error instances
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle objects with a message property
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  
  return defaultMessage;
}

/**
 * Type guard to check if an error is a validation error (400 status with ValidationErrorResponse)
 * @param error The error to check
 * @returns True if the error is a validation error with a ValidationErrorResponse body
 */
export function isValidationError(
  error: unknown
): error is ApiError & { status: 400; body: ValidationErrorResponse } {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    error.body !== null &&
    error.body !== undefined &&
    typeof error.body === "object" &&
    "errors" in error.body &&
    (error.body.errors === undefined ||
      (typeof error.body.errors === "object" &&
        error.body.errors !== null &&
        !Array.isArray(error.body.errors)))
  );
}

/**
 * Normalized result for request analysis submission errors (upload-cyclonedx or reports/new).
 * Components use this to set field-level and generic error state without API-specific parsing.
 */
export interface RequestAnalysisSubmissionError {
  /** Field name to error message (e.g. cveId, file, sourceRepo, commitId) */
  fieldErrors: Record<string, string>;
  /** Generic message when no field-specific errors or for non-400 errors */
  genericMessage: string | null;
}

const DEFAULT_SUBMISSION_ERROR = "An error occurred while submitting the analysis request.";

/**
 * Parses errors from request analysis submission (POST upload-cyclonedx or POST reports/new)
 * into a normalized shape. Use in the request analysis modal to set field errors and alert
 * without embedding API-specific parsing in the component.
 */
export function parseRequestAnalysisSubmissionError(
  error: unknown,
  fallbackMessage: string = DEFAULT_SUBMISSION_ERROR
): RequestAnalysisSubmissionError {
  if (isValidationError(error)) {
    const errors = error.body.errors ?? {};
    const fieldErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(errors)) {
      if (typeof value === "string") fieldErrors[key] = value;
    }
    return {
      fieldErrors,
      genericMessage: Object.keys(fieldErrors).length === 0 ? "Invalid request data. Please check your inputs." : null,
    };
  }
  if (error instanceof ApiError && error.status === 400 && error.body != null && typeof error.body === "object") {
    const body = error.body as Record<string, unknown>;
    if ("error" in body && typeof body.error === "string") {
      return { fieldErrors: {}, genericMessage: body.error };
    }
  }
  return {
    fieldErrors: {},
    genericMessage: getErrorMessage(error, fallbackMessage),
  };
}
