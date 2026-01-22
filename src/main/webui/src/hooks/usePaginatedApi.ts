/**
 * Hook for paginated API calls that captures response headers
 * Returns pagination metadata from X-Total-Elements and X-Total-Pages headers
 */

import { useState, useEffect, useRef } from 'react';
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
  refetch: () => void;
}

export interface UsePaginatedApiOptions {
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
 * Hook for paginated API calls that returns { data, loading, error, pagination }
 * 
 * @param apiCall - Function that returns ApiRequestOptions for the request
 * @param options - Configuration options
 * @returns Object with data, loading, error, and pagination states
 * 
 * @example
 * ```tsx
 * const { data, loading, error, pagination } = usePaginatedApi(
 *   () => ({
 *     method: 'GET',
 *     url: '/api/reports',
 *     query: { page: page - 1, pageSize: PER_PAGE, productId, vulnId },
 *   }),
 *   { deps: [page, productId, vulnId] }
 * );
 * ```
 */
export function usePaginatedApi<T>(
  apiCall: () => ApiRequestOptions,
  options: UsePaginatedApiOptions = {}
): UsePaginatedApiResult<T> {
  const { immediate = true, deps = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef<boolean>(false);

  const execute = async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    cancelledRef.current = false;
    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const requestOptions = apiCall();
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
        setData(responseData);
        setLoading(false);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      cancelledRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  const refetch = () => {
    execute();
  };

  return { data, loading, error, pagination, refetch };
}

