/**
 * Hook for paginated API calls that captures response headers
 * Returns pagination metadata from X-Total-Elements and X-Total-Pages headers
 */

import { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { OpenAPI } from '../generated-client/core/OpenAPI';
import { getHeaders } from '../generated-client/core/request';
import type { ApiRequestOptions } from '../generated-client/core/ApiRequestOptions';

// Helper to build URL from request options (re-implemented since getUrl is not exported)
const isDefined = <T>(value: T | null | undefined): value is Exclude<T, null | undefined> => {
  return value !== undefined && value !== null;
};

const getQueryString = (params: Record<string, any>): string => {
  const qs: string[] = [];

  const append = (key: string, value: any) => {
    qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };

  const process = (key: string, value: any) => {
    if (isDefined(value)) {
      if (Array.isArray(value)) {
        value.forEach(v => {
          process(key, v);
        });
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => {
          process(`${key}[${k}]`, v);
        });
      } else {
        append(key, value);
      }
    }
  };

  Object.entries(params).forEach(([key, value]) => {
    process(key, value);
  });

  if (qs.length > 0) {
    return `?${qs.join('&')}`;
  }

  return '';
};

const buildUrl = (config: typeof OpenAPI, options: ApiRequestOptions): string => {
  const encoder = config.ENCODE_PATH || encodeURI;
  
  const path = options.url
    .replace('{api-version}', config.VERSION)
    .replace(/{(.*?)}/g, (substring: string, group: string) => {
      if (options.path?.hasOwnProperty(group)) {
        return encoder(String(options.path[group]));
      }
      return substring;
    });
  
  const url = `${config.BASE}${path}`;
  if (options.query) {
    return `${url}${getQueryString(options.query)}`;
  }
  return url;
};

export interface PaginationInfo {
  totalElements: number;
  totalPages: number;
}

export interface UsePaginatedApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo | null;
}

export interface UsePaginatedApiOptions<T = unknown> {
  /**
   * Dependencies array — when these change, the API will be called again
   */
  deps?: unknown[];
  /**
   * Absolute URL or same-origin path for Server-Sent Events. When set, each SSE message triggers
   * the same paginated REST request again (after the initial load), subject to debounce and {@link shouldRefresh}.
   */
  sseRefreshPath?: string;
  /**
   * When {@link sseRefreshPath} is set, called with the latest data before each SSE-driven refetch.
   * Return false to close the EventSource.
   */
  shouldRefresh?: (data: T | null) => boolean;
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
 * Hook for paginated API calls that returns { data, loading, error, pagination }.
 * Fetches on mount and when dependencies change (debounced after the first load).
 * Optional {@link UsePaginatedApiOptions.sseRefreshPath} enables catalog invalidation via SSE.
 */
export function usePaginatedApi<T>(
  apiCall: () => ApiRequestOptions,
  options: UsePaginatedApiOptions<T> = {}
): UsePaginatedApiResult<T> {
  const { deps = [], sseRefreshPath } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const initialFetchCompleteRef = useRef<boolean>(false);
  const previousDataRef = useRef<T | null>(null);
  const apiCallRef = useRef<() => ApiRequestOptions>(apiCall);
  // Store options in ref to avoid stale closures
  const optionsRef = useRef<UsePaginatedApiOptions<T>>(options);
  const dataRef = useRef<T | null>(null);
  // Track if this is the very first mount (not dependency changes)
  const isFirstMountRef = useRef<boolean>(true);
  // Store debounced execute function
  const debouncedExecuteRef = useRef<ReturnType<typeof debounce> | null>(null);
  // Track if debounce is pending (user is typing/changing filters)
  const debouncePendingRef = useRef<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Update options ref whenever options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Update data ref whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const execute = async (isDependencyChange: boolean = false) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    cancelledRef.current = false;
    // Only set loading to true on the very first mount, not on dependency changes or SSE refetch
    // This prevents showing skeleton when sort/filter changes
    // Check if data is null (initial load) AND this is the first mount
    if (data === null && isFirstMountRef.current) {
      setLoading(true);
    }
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const requestOptions = apiCallRef.current();
      const url = buildUrl(OpenAPI, requestOptions);
      const headers = await getHeaders(OpenAPI, requestOptions);

      const response = await fetch(url, {
        method: requestOptions.method,
        headers,
        signal: abortController.signal,
        credentials: OpenAPI.WITH_CREDENTIALS ? OpenAPI.CREDENTIALS : undefined,
      });

      if (cancelledRef.current) {
        return;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Extract pagination headers
      const totalElements = response.headers.get('X-Total-Elements');
      const totalPages = response.headers.get('X-Total-Pages');
      
      const paginationInfo: PaginationInfo = {
        totalElements: totalElements ? parseInt(totalElements, 10) : 0,
        totalPages: totalPages ? parseInt(totalPages, 10) : 0,
      };
      setPagination(paginationInfo);

      // Parse response body
      const contentType = response.headers.get('Content-Type');
      let responseData: T;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text() as unknown as T;
      }

      if (!cancelledRef.current) {
        // Always update if dependencies changed (filters/pagination changed)
        // Otherwise, check if we should update based on comparison function
        const shouldUpdate = optionsRef.current.shouldUpdate;
        const shouldUpdateState = isDependencyChange || !shouldUpdate
          ? true
          : shouldUpdate(previousDataRef.current, responseData);
        
        if (shouldUpdateState) {
          setData(responseData);
        }
        
        // Always update previous data ref for future comparisons
        previousDataRef.current = responseData;
      
        initialFetchCompleteRef.current = true;
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        initialFetchCompleteRef.current = true;
      }
      console.error("Error in usePaginatedApi", err);
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      // Mark that first mount is complete after first fetch (success or error)
      // This ensures skeleton only shows on initial load, not on dependency changes
      isFirstMountRef.current = false;
    }
  };

  // Update apiCallRef whenever it changes (separate effect to avoid unnecessary re-runs)
  useEffect(() => {
    apiCallRef.current = apiCall;
  });

  useEffect(() => {
    // Reset previous data ref when deps change (new query = fresh comparison)
    previousDataRef.current = null;
    
    // On initial mount, execute immediately without debounce
    if (isFirstMountRef.current) {
      // Pass true to indicate this is a dependency change, so we always update
      // execute() will set isFirstMountRef.current = false in its finally block
      execute(true);
    } else {
      // On subsequent dependency changes, debounce the API call
      // Create debounced function if it doesn't exist
      if (!debouncedExecuteRef.current) {
        debouncedExecuteRef.current = debounce(() => {
          execute(true);
          // Clear pending flag when debounce fires
          debouncePendingRef.current = false;
        }, 300);
      }
      
      // Mark as pending and call the debounced function
      debouncePendingRef.current = true;
      debouncedExecuteRef.current();
    }

    return () => {
      cancelledRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancel any pending debounced calls
      if (debouncedExecuteRef.current) {
        debouncedExecuteRef.current.cancel();
        debouncePendingRef.current = false; // Clear pending state on cancel
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
      if (debouncePendingRef.current) {
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
      void execute(false);
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

  return { data, loading, error, pagination };
}

