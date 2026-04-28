// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { REPORTS_LIVE_UPDATES_SSE_PATH } from "../constants/sse";

export type LiveUpdatesStore = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => number;
};

const LiveUpdatesContext = createContext<LiveUpdatesStore | null>(null);

/**
 * Owns one {@link EventSource} for the server push stream that signals report/product data may have changed.
 * Hooks opt in with `liveUpdatesRefresh` on `useApi` / `usePaginatedApi` and observe bumps via `useLiveUpdatesRevision`.
 */
export function LiveUpdatesProvider({ children }: { children: ReactNode }) {
  const stateRef = useRef({ revision: 0, listeners: new Set<() => void>() });

  const bump = useCallback(() => {
    stateRef.current.revision += 1;
    stateRef.current.listeners.forEach((fn) => {
      fn();
    });
  }, []);

  useEffect(() => {
    const url = `${window.location.origin}${REPORTS_LIVE_UPDATES_SSE_PATH}`;
    const es = new EventSource(url, { withCredentials: true });
    es.onmessage = () => {
      bump();
    };
    return () => {
      es.close();
    };
  }, [bump]);

  const store = useMemo<LiveUpdatesStore>(
    () => ({
      subscribe: (onChange) => {
        const wrapped = () => {
          onChange();
        };
        stateRef.current.listeners.add(wrapped);
        return () => {
          stateRef.current.listeners.delete(wrapped);
        };
      },
      getSnapshot: () => stateRef.current.revision,
    }),
    []
  );

  return <LiveUpdatesContext.Provider value={store}>{children}</LiveUpdatesContext.Provider>;
}

/**
 * Monotonic counter incremented on each SSE message from the live-updates stream.
 * When {@code enabled} is false, does not subscribe (no subscription churn for hooks that opted out).
 */
export function useLiveUpdatesRevision(enabled: boolean): number {
  const store = useContext(LiveUpdatesContext);
  return useSyncExternalStore(
    (onChange) => {
      if (!enabled || !store) {
        return () => {};
      }
      return store.subscribe(onChange);
    },
    () => (enabled && store ? store.getSnapshot() : 0),
    () => 0
  );
}
