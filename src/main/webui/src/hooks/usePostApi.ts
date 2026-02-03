/**
 * Hook for manual/triggered API calls (typically POST requests)
 * Does not fetch immediately - requires manual trigger via execute() or refetch()
 * Does not support polling (use useApi for polling scenarios)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { CancelablePromise } from '../generated-client';

export interface UsePostApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => void;
}

/**
 * Hook for manual API calls that require explicit triggering
 * Typically used for POST, PUT, DELETE operations
 * 
 * @param apiCall - Function that returns a promise (or CancelablePromise)
 * @returns Object with data, loading, error states and execute function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = usePostApi(() => 
 *   Reports.postApiReportsNew({ requestBody: report })
 * );
 * 
 * // Trigger manually
 * <button onClick={execute}>Submit</button>
 * ```
 */
export function usePostApi<T>(
  apiCall: () => Promise<T> | CancelablePromise<T>
): UsePostApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Keep track of the current promise to cancel it if needed
  const promiseRef = useRef<CancelablePromise<T> | Promise<T> | null>(null);
  const cancelledRef = useRef<boolean>(false);

  const execute = useCallback(() => {
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
  }, [apiCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      // Cancel the promise if it's a CancelablePromise
      if (promiseRef.current && 'cancel' in promiseRef.current) {
        (promiseRef.current as CancelablePromise<T>).cancel();
      }
    };
  }, []);

  return { data, loading, error, execute };
}

