# report-events-stream Specification

## Purpose
Push **catalog** invalidation from the Quarkus app to the browser so report and product views refetch over REST when MongoDB-backed data changes. The web UI does not poll on a timer for this; it listens on a single authenticated SSE endpoint and refetches existing REST queries when events arrive.

## Requirements

### Requirement: Authenticated SSE endpoint
The backend SHALL expose `GET /api/v1/reports/stream` (JAX-RS path `/reports/stream` under the application REST root `quarkus.rest.path=/api/v1`) with `Content-Type: text/event-stream`, each stream element serialized as JSON (`ReportSseMessage`). The endpoint SHALL use the same JWT security as other `/api/v1` resources (`ReportStreamResource`).

#### Scenario: Client opens a long-lived stream
- **WHEN** a browser issues `GET /api/v1/reports/stream` with valid authentication
- **THEN** the server keeps the connection open and pushes JSON SSE elements until the client disconnects or the server drops the subscriber (e.g. emit failure)

### Requirement: Catalog event payload
Each emitted item SHALL conform to `ReportSseMessage`: `type` (string), optional `reportId`, optional `productId` (both omitted from JSON when null via `@JsonInclude(NON_NULL)`). Today the server only publishes catalog invalidation as `type: "catalog"` with `reportId` and `productId` null; additional fields or types MAY be introduced later without changing the coarse-invalidation contract.

#### Scenario: Coarse catalog signal
- **WHEN** the application publishes a catalog change
- **THEN** subscribers receive an SSE `data` line whose JSON includes `"type":"catalog"` and clients SHOULD treat any cached report/product list or catalog-related REST data as stale

### Requirement: Server-side fan-out
The application SHALL use an application-scoped `ReportSseBroadcaster` that registers one Mutiny `Multi` emitter per connected stream and broadcasts each `ReportSseMessage` to all active emitters. Subscribers SHALL be held in a thread-safe collection suitable for concurrent iteration (e.g. `CopyOnWriteArrayList`). If emitting to a subscriber fails, that subscriber SHALL be removed so other clients are unaffected.

#### Scenario: Multiple tabs receive the same event
- **WHEN** two or more clients are connected
- **AND** the server publishes one catalog message
- **THEN** each connected client receives that message on its own stream

### Requirement: Emit after persistence
`publishCatalogChanged()` SHALL be invoked from report and product repository layers after MongoDB writes that affect lists or catalog views (including report lifecycle updates, removals, product save/remove, product `completed_at` updates, and submission-failure bookkeeping). When product `completed_at` is updated in the same logical flow as a report mutation that already ends with `publishCatalogChanged()`, the implementation SHALL persist that product field without its own catalog publish so the flow emits one catalog event, not two.

#### Scenario: Callback drives UI refresh
- **WHEN** this app persists report or product document changes that affect catalog or list views
- **THEN** connected browsers receive at least one catalog event aligned with that persistence (and SHOULD refetch their current REST queries)

### Requirement: Web client connection sharing
The web UI SHALL NOT open a separate browser `EventSource` per hook instance for the same stream URL. It SHALL use the module-level `SSEListener` (`src/main/webui/src/utils/sseListener.ts`): at most one `EventSource` per absolute URL, with `subscribe(pathOrUrl, listener)` registering callbacks and returning an idempotent unsubscribe that removes only that listener. The connection SHALL be closed when the last listener unsubscribes. Hooks such as `useApi` and `usePaginatedApi` SHALL subscribe with `withCredentials: true` when opening the underlying `EventSource`.

#### Scenario: Several hooks share one TCP connection
- **WHEN** multiple components use `sseRefreshPath` pointing at the same catalog stream (e.g. `REPORT_CATALOG_SSE_PATH`)
- **THEN** the browser maintains one `EventSource` for that URL and dispatches each SSE message to all registered listeners

#### Scenario: Listener stops without tearing down peers
- **WHEN** a hook unsubscribes (unmount, dependency change, or `shouldRefresh` returning false)
- **THEN** only that hook’s listener is removed
- **AND** other subscribers on the same URL remain connected until they unsubscribe or the server closes their stream
