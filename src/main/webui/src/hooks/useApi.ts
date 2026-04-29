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
 * Generic React hook for API calls
 * Supports any promise (including CancelablePromise from generated client)
 * Returns { data, loading, error } with proper cleanup
 */

import { useState, useEffect, useRef } from "react";
import type { CancelablePromise } from "../generated-client";
import { useLiveUpdatesRevision } from "../contexts/LiveUpdatesContext";

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
   * When true, refetches after each server live-update SSE tick (see LiveUpdatesProvider), subject to shouldRefresh.
   */
  liveUpdatesRefresh?: boolean;
  /**
   * When liveUpdatesRefresh is true, called with the latest data before each SSE-driven refetch.
   * Return false to skip the refetch (for example when the resource has reached a terminal state).
   */
  shouldRefresh?: (data: T | null) => boolean;
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
  const { deps = [], liveUpdatesRefresh = false } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const promiseRef = useRef<CancelablePromise<T> | Promise<T> | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const initialFetchCompleteRef = useRef<boolean>(false);
  const optionsRef = useRef<UseApiOptions<T>>(options);
  const dataRef = useRef<T | null>(null);

  const liveUpdatesRevision = useLiveUpdatesRevision(liveUpdatesRefresh);

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
            setData(result);
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
    if (!liveUpdatesRefresh) {
      return;
    }
    if (liveUpdatesRevision === 0) {
      return;
    }
    if (!initialFetchCompleteRef.current) {
      return;
    }
    const shouldRefresh = optionsRef.current.shouldRefresh;
    if (shouldRefresh && !shouldRefresh(dataRef.current)) {
      return;
    }
    execute(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveUpdatesRevision, liveUpdatesRefresh]);

  return { data, loading, error };
}
