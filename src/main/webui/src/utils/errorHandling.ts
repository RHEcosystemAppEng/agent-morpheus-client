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


