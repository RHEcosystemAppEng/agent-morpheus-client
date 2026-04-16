# SSE live refresh: what to change where

## Vulnerability analysis agent (Morpheus)

**No repository changes required** if it already POSTs completed analysis JSON to this application’s callback (e.g. `POST .../reports/receive` on the ExploitIQ Client). The agent does not talk to the browser; it only talks to this backend.

## This application (ExploitIQ Client / Quarkus)

- **`GET /api/v1/reports/stream`** — `Content-Type: text/event-stream`, JSON events such as `{ "type": "catalog", "reportId": null, "productId": null }`. Browsers use `EventSource` with `withCredentials: true` on the same origin.
- **Emitters** — After writes to MongoDB **reports** or **products** collections, the server publishes a `catalog` event so the UI refetches existing REST endpoints (no full payloads over SSE).

## Proxies / OpenShift route

If a reverse proxy buffers responses, SSE can stall. For that path, disable buffering (e.g. nginx `proxy_buffering off` for `/api/v1/reports/stream`).
