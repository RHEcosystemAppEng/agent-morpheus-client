/**
 * Generic React hook for API calls
 * Supports any promise (including CancelablePromise from generated client)
 * Returns { data, loading, error } with proper cleanup
 */

import { useState, useEffect, useRef } from "react";
import type { CancelablePromise } from "../generated-client";

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseApiOptions<T = unknown> {
  /**
   * Dependencies array — when these change, the API will be called again
   */
  deps?: unknown[];
  /**
   * Same-origin path or absolute URL for Server-Sent Events. When set, successful responses
   * are followed by an `EventSource` (with credentials); each message triggers the same REST
   * request function again.
   */
  sseRefreshPath?: string;
  /**
   * When {@link sseRefreshPath} is set, called with the latest data before each SSE-driven refetch.
   * Return false to close the stream (for example when the resource has reached a terminal state).
   * If omitted, every SSE message triggers a refetch while the connection stays open.
   */
  shouldRefresh?: (data: T | null) => boolean;
  /**
   * Compare previous and current data to decide whether to update React state.
   * If provided, state updates only when this returns true (avoids rerenders when nothing meaningful changed).
   */
  shouldUpdate?: (previousData: T | null, currentData: T) => boolean;
}

/**
 * Hook for immediate API calls with optional SSE-driven refetch.
 * Always fetches on mount and when dependencies change.
 * For manual calls (POST, etc.), use useExecuteApi instead.
 */
export function useApi<T>(
  apiCall: () => Promise<T> | CancelablePromise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { deps = [], sseRefreshPath } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const promiseRef = useRef<CancelablePromise<T> | Promise<T> | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const initialFetchCompleteRef = useRef<boolean>(false);
  const previousDataRef = useRef<T | null>(null);
  const optionsRef = useRef<UseApiOptions<T>>(options);
  const dataRef = useRef<T | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const execute = (isDependencyChange: boolean = false) => {
    if (promiseRef.current && "cancel" in promiseRef.current) {
      (promiseRef.current as CancelablePromise<T>).cancel();
    }

    cancelledRef.current = false;
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
            const shouldUpdate = optionsRef.current.shouldUpdate;
            const shouldUpdateState = shouldUpdate
              ? shouldUpdate(previousDataRef.current, result)
              : true;
            if (shouldUpdateState) {
              setData(result);
            }
            previousDataRef.current = result;

            setLoading(false);
            promiseRef.current = null;
            initialFetchCompleteRef.current = true;
          }
        })
        .catch((err) => {
          if (err?.isCancelled || err?.name === "CancelError") {
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
    initialFetchCompleteRef.current = false;
    previousDataRef.current = null;

    execute(true);

    return () => {
      cancelledRef.current = true;
      if (promiseRef.current && "cancel" in promiseRef.current) {
        (promiseRef.current as CancelablePromise<T>).cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  useEffect(() => {
    if (!sseRefreshPath) {
      return;
    }
    const url = sseRefreshPath.startsWith("http")
      ? sseRefreshPath
      : `${window.location.origin}${sseRefreshPath}`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;
    es.onmessage = () => {
      if (!initialFetchCompleteRef.current) {
        return;
      }
      const shouldRefresh = optionsRef.current.shouldRefresh;
      if (shouldRefresh && !shouldRefresh(dataRef.current)) {
        es.close();
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
        return;
      }
      execute(false);
    };
    return () => {
      es.close();
      if (eventSourceRef.current === es) {
        eventSourceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseRefreshPath, ...deps]);

  useEffect(() => {
    if (!sseRefreshPath) {
      return;
    }
    const shouldRefresh = optionsRef.current.shouldRefresh;
    if (shouldRefresh && !shouldRefresh(data) && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, [data, sseRefreshPath]);

  return { data, loading, error };
}
