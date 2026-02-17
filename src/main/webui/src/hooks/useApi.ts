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

export interface UseApiOptions<T = unknown> {
  /**
   * Dependencies array - when these change, the API will be called again
   */
  deps?: unknown[];
  /**
   * Polling interval in milliseconds. If set, the API will be called repeatedly at this interval.
   * @default undefined (no polling)
   */
  pollInterval?: number;
  /**
   * Function to determine if polling should continue based on the current data.
   * If not provided, polling will continue indefinitely (when pollInterval is set).
   * @param data - The current data from the API call
   * @returns true if polling should continue, false to stop
   */
  shouldPoll?: (data: T | null) => boolean;
  /**
   * Function to compare previous and current data to determine if state should be updated.
   * If provided, state will only be updated if this function returns true.
   * This prevents unnecessary rerenders when data hasn't meaningfully changed.
   * @param previousData - The previous data (null on first call)
   * @param currentData - The current data from the API call
   * @returns true if state should be updated, false to skip the update
   */
  shouldUpdate?: (previousData: T | null, currentData: T) => boolean;
}

/**
 * Hook for immediate API calls with optional polling support.
 * Always fetches immediately on mount and when dependencies change.
 * For manual/triggered API calls (e.g., POST requests), use useExecuteApi instead.
 * 
 * @param apiCall - Function that returns a promise (or CancelablePromise)
 * @param options - Configuration options
 * @returns Object with data, loading, and error states
 * 
 * @example
 * ```tsx
 * // Simple usage
 * const { data, loading, error } = useApi(() => 
 *   Reports.getApiReports1({ id: reportId })
 * );
 * 
 * // With dependencies
 * const { data, loading, error } = useApi(
 *   () => Reports.getApiReports1({ id: reportId }),
 *   { deps: [reportId] }
 * );
 * 
 * // With polling
 * const { data, loading, error } = useApi(
 *   () => Reports.getApiReports1({ id: reportId }),
 *   { 
 *     deps: [reportId],
 *     pollInterval: 5000,
 *     shouldPoll: (data) => data?.status !== 'completed'
 *   }
 * );
 * ```
 */
export function useApi<T>(
  apiCall: () => Promise<T> | CancelablePromise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { deps = [], pollInterval } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Keep track of the current promise to cancel it if needed
  const promiseRef = useRef<CancelablePromise<T> | Promise<T> | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchCompleteRef = useRef<boolean>(false);
  const previousDataRef = useRef<T | null>(null);
  // Store options in ref to avoid stale closures
  const optionsRef = useRef<UseApiOptions<T>>(options);
  // Store data in ref to access latest value in polling callback without restarting interval
  const dataRef = useRef<T | null>(null);
  
  // Update options ref whenever options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  // Update data ref whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const execute = (isDependencyChange: boolean = false) => {
    // Cancel previous request if it's a CancelablePromise
    if (promiseRef.current && 'cancel' in promiseRef.current) {
      (promiseRef.current as CancelablePromise<T>).cancel();
    }

    cancelledRef.current = false;
    // Only set loading to true on initial fetch or dependency changes, not during polling
    if (isDependencyChange || !initialFetchCompleteRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const promise = apiCall();
      promiseRef.current = promise;

      promise
        .then((result) => {
          if (!cancelledRef.current) {
            // Check if we should update based on comparison function
            const shouldUpdate = optionsRef.current.shouldUpdate;
            const shouldUpdateState = shouldUpdate
              ? shouldUpdate(previousDataRef.current, result)
              : true;
            if (shouldUpdateState) {
              setData(result);
            }
            // Always update previous data ref for future comparisons
            previousDataRef.current = result;
            
            // Always update loading state, even if data didn't change
            setLoading(false);
            promiseRef.current = null;
            initialFetchCompleteRef.current = true;
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
            initialFetchCompleteRef.current = true;
          }
        });
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        initialFetchCompleteRef.current = true;
      }
    }
  };

  useEffect(() => {
    // Reset initial fetch flag when deps change
    initialFetchCompleteRef.current = false;
    // Reset previous data ref when deps change (new query = fresh comparison)
    previousDataRef.current = null;
    
    // Always execute immediately (this is useApi, not usePostApi)
    // Pass true to indicate this is a dependency change, so loading state is updated
    execute(true);

    return () => {
      cancelledRef.current = true;
      // Cancel the promise if it's a CancelablePromise
      if (promiseRef.current && 'cancel' in promiseRef.current) {
        (promiseRef.current as CancelablePromise<T>).cancel();
      }
      // Clear polling interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  // Set up polling if pollInterval is provided
  // Wait for initial fetch to complete before starting polling to prevent duplicate calls
  useEffect(() => {
    if (!pollInterval) {
      return;
    }
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // This prevents duplicate API calls on mount    
    // Set up polling interval
    intervalRef.current = setInterval(() => {
      // Check if we should continue polling using latest data from ref
      if (!initialFetchCompleteRef.current) {
        return;
      }
      const shouldPoll = optionsRef.current.shouldPoll;
      if (shouldPoll && !shouldPoll(dataRef.current)) {
        // Stop polling if shouldPoll returns false
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      // Execute the API call (not a dependency change, so don't update loading state)
      execute(false);
    }, pollInterval);
    

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollInterval]);

  return { data, loading, error };
}

