# api-hooks Specification

## Purpose
The api-hooks capability defines React hooks for making API calls with features such as pagination support, debouncing, and **SSE-driven** live refresh. The hooks provide a consistent interface for data fetching with automatic state management (loading, error, data), optional live-update invalidation via Server-Sent Events, and behavior to prevent unnecessary API calls. 

## Requirements
### Requirement: useApi Hook for Immediate API Calls
The `useApi` hook SHALL provide immediate API calls that execute on mount and when dependencies change. The hook SHALL support optional **SSE**-driven live refresh via `liveUpdatesRefresh` (ticks from `LiveUpdatesProvider`; same-origin `EventSource` with credentials is opened only in that provider). The hook SHALL return `{ data, loading, error }`.

The hook SHALL fetch data immediately on mount and when dependencies in the `deps` array change. When `liveUpdatesRefresh` is true, the hook SHALL re-execute after each live-update tick (after initial load completes), subject to an optional `shouldRefresh` callback that skips the refetch when it returns false (the global `EventSource` remains open).

#### Scenario: useApi immediate execution
- **WHEN** a component uses `useApi` hook
- **THEN** the API call executes immediately on mount
- **AND** the hook returns `{ data, loading, error }` states

#### Scenario: useApi with dependencies
- **WHEN** `useApi` is configured with a `deps` array
- **THEN** the API call executes immediately on mount
- **AND** the API call re-executes whenever any dependency in the `deps` array changes

#### Scenario: useApi with live updates SSE
- **WHEN** `useApi` is configured with `liveUpdatesRefresh: true` and the app is wrapped in `LiveUpdatesProvider`
- **THEN** the API call executes immediately on mount
- **AND** the API call re-executes on each live-update tick (after initial load completes), subject to `shouldRefresh` when provided
- **AND** if `shouldRefresh` returns false, that refetch is skipped (the shared live-updates `EventSource` is unchanged)

### Requirement: usePostApi Hook for Manual API Calls
The `usePostApi` hook SHALL provide manual API calls that require explicit triggering. The hook SHALL be used for POST, PUT, DELETE operations that should not execute automatically. The hook SHALL return `{ data, loading, error, execute }` where `execute` must be called to trigger the API call.

The `usePostApi` hook SHALL NOT execute automatically on mount. The hook SHALL only execute when the `execute` function is explicitly called. The hook SHALL support cancellation of in-flight requests.

#### Scenario: usePostApi manual execution
- **WHEN** a component uses `usePostApi` hook
- **THEN** the API call does NOT execute automatically on mount
- **AND** the hook returns `{ data, loading, error, execute }` states
- **AND** the API call executes only when `execute()` is called

#### Scenario: usePostApi loading state
- **WHEN** `usePostApi` `execute()` function is called
- **THEN** the loading state is set to true
- **AND** the loading state is set to false when the API call completes (success or error)

### Requirement: useReport Hook
The `useReport` hook SHALL use `useApi` internally to fetch report data from the `/api/v1/reports/product/${productId}` endpoint. The hook SHALL provide a convenient wrapper around `useApi` for fetching SBOM report data.

#### Scenario: useReport fetches report data
- **WHEN** a component uses `useReport` hook with a product ID
- **THEN** the hook uses `useApi` internally to fetch from `/api/v1/reports/product/${productId}`
- **AND** the hook returns `{ data, loading, error }`

### Requirement: Debounced Dependency Changes in Paginated API Hook
The `usePaginatedApi` hook SHALL debounce API calls when dependencies in the `deps` array change (excluding the initial mount). The hook SHALL wait for a debounce period of 300ms before executing the API call after a dependency change. This prevents excessive API calls when users are typing in filter input fields, which is the primary use case.

Since the hook cannot distinguish between filter dependencies and pagination dependencies (both are included in the same `deps` array), the debounce SHALL apply to all dependency changes after the initial mount. This means pagination changes will also be debounced by 300ms, which is an acceptable trade-off to solve the filter keystroke problem.

The debounce SHALL only apply to dependency changes after the initial mount. The initial mount SHALL execute immediately without debounce. **SSE-triggered** refetch SHALL skip execution when a debounce is pending (user is actively typing or changing filters) to prevent refetch with stale filter values. Live refresh SHALL resume after the debounce fires and completes.

#### Scenario: Debounce on dependency change
- **WHEN** any dependency in the `deps` array of `usePaginatedApi` changes (after initial mount)
- **THEN** the API call is debounced for 300ms
- **AND** if dependencies continue to change within 300ms, the previous debounce timer is cancelled and a new 300ms timer starts
- **AND** the API call executes only after dependencies remain unchanged for 300ms

#### Scenario: Debounce on filter keystroke
- **WHEN** a user types in a filter field (e.g., SBOM Name or CVE ID) that is included in the `deps` array
- **THEN** each keystroke triggers a dependency change
- **AND** the API call is debounced for 300ms
- **AND** if the user continues typing within 300ms, the debounce timer resets
- **AND** the API call executes only after the user stops typing for 300ms

#### Scenario: Debounce on pagination change
- **WHEN** a user changes pagination (e.g., clicks to change page number) that is included in the `deps` array
- **THEN** the API call is debounced for 300ms before executing
- **AND** this 300ms delay is acceptable as pagination changes are discrete user actions

#### Scenario: Immediate execution on initial mount
- **WHEN** a component using `usePaginatedApi` first mounts
- **THEN** the API call executes immediately without debounce
- **AND** the debounce mechanism does not apply to the initial fetch

#### Scenario: Live refresh skips when debounce is pending
- **WHEN** `usePaginatedApi` is configured with `liveUpdatesRefresh: true` AND a user is actively typing in a filter field (debounce is pending)
- **THEN** live refresh skips execution during the debounce period
- **AND** live refresh resumes after the debounce fires and the filter change completes
- **AND** this prevents refetch from executing with stale filter values

#### Scenario: Live refresh continues when no debounce is pending
- **WHEN** `usePaginatedApi` is configured with `liveUpdatesRefresh: true` AND no debounce is pending (user is not typing)
- **THEN** SSE messages trigger refetch as configured
- **AND** dependency changes are still debounced even when live refresh is active

#### Scenario: Live refresh preserves pagination and filter settings
- **WHEN** `usePaginatedApi` is configured with `liveUpdatesRefresh: true` AND a live refresh executes
- **THEN** the API call preserves current pagination, sorting, and filter settings from the dependencies
- **AND** the call uses the same query parameters as the last successful API call

### Requirement: liveUpdatesRefresh on useApi and usePaginatedApi
Both hooks SHALL accept optional `liveUpdatesRefresh`; when true they SHALL react to ticks from `LiveUpdatesProvider` (not by opening their own `EventSource`). Refetches SHALL use the same REST/fetch paths as before.

#### Scenario: Debounce parity
- **WHEN** `usePaginatedApi` has pending filter debounce and a live-update SSE tick occurs
- **THEN** refetch is skipped until debounce completes
