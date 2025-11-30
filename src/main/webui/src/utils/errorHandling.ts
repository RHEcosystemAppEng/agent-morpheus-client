/**
 * Error handling and loading state management utilities
 */

import { ApiError } from "../generated-client";


/**
 * User-friendly error message formatter
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    
    // Handle specific HTTP status codes
    if (apiError.status === 404) {
      return 'The requested resource was not found.';
    }
    if (apiError.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    if (apiError.status === 401) {
      return 'Authentication required. Please log in.';
    }
    if (apiError.status === 500) {
      return 'An internal server error occurred. Please try again later.';
    }
    if (apiError.status === 0) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return apiError.message || 'An unexpected error occurred.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}


