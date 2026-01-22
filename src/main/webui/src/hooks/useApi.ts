/**
 * Generic React hook for API calls
 * Supports any promise (including CancelablePromise from generated client)
 * Returns { data, loading, error } with proper cleanup
 */

import { useState, useEffect, useRef } from 'react';
import type { CancelablePromise } from '../generated-client';

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseApiOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
  /**
   * Dependencies array - when these change, the API will be called again
   */
  deps?: unknown[];
}

/**
 * Generic hook for API calls that returns { data, loading, error }
 * 
 * @param apiCall - Function that returns a promise (or CancelablePromise)
 * @param options - Configuration options
 * @returns Object with data, loading, and error states
 * 
 * @example
 * ```tsx
 * // Simple usage
 * const { data, loading, error } = useApi(() => 
 *   Reports.getApiReportsSummary()
 * );
 * 
 * // With dependencies
 * const { data, loading, error } = useApi(
 *   () => Reports.getApiReports1({ id: reportId }),
 *   { deps: [reportId] }
 * );
 * 
 * // Manual trigger (immediate: false)
 * const { data, loading, error, refetch } = useApi(
 *   () => Reports.postApiReportsNew({ requestBody: report }),
 *   { immediate: false }
 * );
 * ```
 */
export function useApi<T>(
  apiCall: () => Promise<T> | CancelablePromise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> & { refetch: () => void } {
  const { immediate = true, deps = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<Error | null>(null);
  
  // Keep track of the current promise to cancel it if needed
  const promiseRef = useRef<CancelablePromise<T> | Promise<T> | null>(null);
  const cancelledRef = useRef<boolean>(false);

  const execute = () => {
    // Cancel previous request if it's a CancelablePromise
    if (promiseRef.current && 'cancel' in promiseRef.current) {
      (promiseRef.current as CancelablePromise<T>).cancel();
    }

    cancelledRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const promise = apiCall();
      promiseRef.current = promise;

      promise
        .then((result) => {
          if (!cancelledRef.current) {
            setData(result);
            setLoading(false);
            promiseRef.current = null;
          }
        })
        .catch((err) => {
          // Ignore cancellation errors
          if (err?.isCancelled || err?.name === 'CancelError') {
            return;
          }
          
          if (!cancelledRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
            promiseRef.current = null;
          }
        });
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      cancelledRef.current = true;
      // Cancel the promise if it's a CancelablePromise
      if (promiseRef.current && 'cancel' in promiseRef.current) {
        (promiseRef.current as CancelablePromise<T>).cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  const refetch = () => {
    execute();
  };

  return { data, loading, error, refetch };
}

