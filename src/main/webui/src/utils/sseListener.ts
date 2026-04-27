/**
 * One browser {@link EventSource} per absolute URL; hooks register listeners instead of opening
 * duplicate TCP connections for the same stream.
 */

type SseMessageListener = () => void;

interface SseConnection {
  eventSource: EventSource;
  listeners: Set<SseMessageListener>;
}

const connections = new Map<string, SseConnection>();

function toAbsoluteUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${window.location.origin}${pathOrUrl}`;
}

function dispatchMessage(url: string): void {
  const conn = connections.get(url);
  if (!conn) {
    return;
  }
  for (const listener of [...conn.listeners]) {
    try {
      listener();
    } catch {
      // Listener errors are isolated so one hook cannot break others.
    }
  }
}

/**
 * Registers {@code onMessage} for {@code pathOrUrl}. The underlying {@link EventSource} is created
 * on first subscription to that URL and closed when the last listener unsubscribes.
 *
 * @returns Idempotent unsubscribe; safe to call multiple times or after the connection was torn down.
 */
function subscribe(pathOrUrl: string, onMessage: SseMessageListener): () => void {
  const url = toAbsoluteUrl(pathOrUrl);
  let conn = connections.get(url);
  if (!conn) {
    const eventSource = new EventSource(url, { withCredentials: true });
    conn = { eventSource, listeners: new Set() };
    eventSource.onmessage = () => {
      dispatchMessage(url);
    };
    connections.set(url, conn);
  }
  conn.listeners.add(onMessage);
  let active = true;
  return () => {
    if (!active) {
      return;
    }
    active = false;
    const current = connections.get(url);
    if (!current) {
      return;
    }
    current.listeners.delete(onMessage);
    if (current.listeners.size === 0) {
      current.eventSource.close();
      connections.delete(url);
    }
  };
}

export const SSEListener = {
  subscribe,
};
