# report-events-stream Specification

## Purpose
Push **catalog** invalidation from the Quarkus app to the browser so report and product views refetch over REST when MongoDB-backed data changes. The web UI does not poll on a timer for this; it listens on a single authenticated SSE endpoint and refetches existing REST queries when events arrive.

## Requirements

### Requirement: Authenticated SSE endpoint
The backend SHALL expose `GET /api/v1/reports/stream` (JAX-RS path `/reports/stream` under the application REST root `quarkus.rest.path=/api/v1`) with `Content-Type: text/event-stream`, each stream element serialized as JSON (`ReportSseMessage`). The endpoint SHALL use the same JWT security as other `/api/v1` resources (`ReportStreamResource`).

#### Scenario: Client opens a long-lived stream
- **WHEN** a browser issues `GET /api/v1/reports/stream` with valid authentication
- **THEN** the server keeps the connection open and pushes JSON SSE elements until the client disconnects or the server drops the subscriber (e.g. emit failure)

### Requirement: Live-update event payload
Each emitted item SHALL serialize as JSON `ReportSseMessage`, which today is the empty object `{}` . The presence of an event SHALL mean report or product data that affects lists or detail views may have changed; clients SHOULD refetch their current REST queries. A future version MAY add explicit fields (for example event kind, `reportId`, `productId`) for targeted invalidation, emitted only from write paths that know those identifiers.

#### Scenario: Coarse invalidation signal
- **WHEN** the application publishes a live update
- **THEN** subscribers receive an SSE `data` line whose JSON is `{}` and clients SHOULD treat cached report/product data as possibly stale

### Requirement: Server-side fan-out
The application SHALL use an application-scoped `ReportSseBroadcaster` that registers one Mutiny `Multi` emitter per connected stream and broadcasts each `ReportSseMessage` to all active emitters. Subscribers SHALL be held in a thread-safe collection suitable for concurrent iteration (e.g. `CopyOnWriteArrayList`). If emitting to a subscriber fails, that subscriber SHALL be removed so other clients are unaffected.

#### Scenario: Multiple tabs receive the same event
- **WHEN** two or more clients are connected
- **AND** the server publishes one live-update message
- **THEN** each connected client receives that message on its own stream

### Requirement: Emit after persistence
`publishCatalogChanged()` SHALL be invoked from report and product repository layers after MongoDB writes that affect lists or catalog views (including report lifecycle updates, removals, product save/remove, product `completed_at` updates, and submission-failure bookkeeping). When product `completed_at` is updated in the same logical flow as a report mutation that already ends with `publishCatalogChanged()`, the implementation SHALL persist that product field without its own publish so the flow emits one live-update event, not two.

#### Scenario: Callback drives UI refresh
- **WHEN** this app persists report or product document changes that affect catalog or list views
- **THEN** connected browsers receive at least one live-update event aligned with that persistence (and SHOULD refetch their current REST queries)

### Requirement: Web client single EventSource via React context
The web UI SHALL open exactly one browser `EventSource` for the live-updates stream (`REPORTS_LIVE_UPDATES_SSE_PATH` in `src/main/webui/src/constants/sse.ts`), owned by `LiveUpdatesProvider` (`src/main/webui/src/contexts/LiveUpdatesContext.tsx`) mounted in `App.tsx` above `BrowserRouter`. The provider SHALL use `withCredentials: true`. Hooks (`useApi`, `usePaginatedApi`) that opt in with `liveUpdatesRefresh` SHALL observe ticks via `useLiveUpdatesRevision` and `useSyncExternalStore` so only those hooks re-render on stream messages, not the entire app. There SHALL be no per-hook `EventSource`, no configurable alternate stream URL, and no subscribe/unsubscribe registry outside React. The UI SHALL treat any SSE message as a tick (it does not depend on payload fields today).

#### Scenario: One TCP connection per browser session
- **WHEN** the app shell mounts with `LiveUpdatesProvider`
- **THEN** one `EventSource` connects to the live-updates stream and stays open for the provider lifetime

#### Scenario: Hooks refetch on live-update ticks
- **WHEN** a hook uses `liveUpdatesRefresh: true` and the live-updates revision increments after an SSE message
- **THEN** the hook refetches (subject to `shouldRefresh` when provided, and paginated debounce rules when applicable)
