# api-hooks Specification

## Purpose
The api-hooks capability defines React hooks for making API calls with features such as pagination support, debouncing, and polling. The hooks provide a consistent interface for data fetching with automatic state management (loading, error, data), optional polling, and intelligent behavior to prevent unnecessary API calls.

## Requirements

### Requirement: useApi Hook for Immediate API Calls
The `useApi` hook SHALL provide immediate API calls that execute on mount and when dependencies change. The hook SHALL support optional polling with conditional logic. The hook SHALL return `{ data, loading, error }`.

The hook SHALL fetch data immediately on mount and when dependencies in the `deps` array change. The hook SHALL support optional polling via `pollInterval` option. The hook SHALL support a `shouldPoll` function to conditionally continue polling based on the current data. The hook SHALL support a `shouldUpdate` function to prevent unnecessary state updates when data hasn't meaningfully changed.

#### Scenario: useApi immediate execution
- **WHEN** a component uses `useApi` hook
- **THEN** the API call executes immediately on mount
- **AND** the hook returns `{ data, loading, error }` states

#### Scenario: useApi with dependencies
- **WHEN** `useApi` is configured with a `deps` array
- **THEN** the API call executes immediately on mount
- **AND** the API call re-executes whenever any dependency in the `deps` array changes

#### Scenario: useApi with polling
- **WHEN** `useApi` is configured with `pollInterval`
- **THEN** the API call executes immediately on mount
- **AND** the API call re-executes at the specified interval
- **AND** if `shouldPoll` is provided, polling continues only while `shouldPoll(data)` returns true

### Requirement: usePostApi Hook for Manual API Calls
The `usePostApi` hook SHALL provide manual API calls that require explicit triggering. The hook SHALL be used for POST, PUT, DELETE operations that should not execute automatically. The hook SHALL return `{ data, loading, error, execute }` where `execute` must be called to trigger the API call.

The hook SHALL NOT execute automatically on mount. The hook SHALL only execute when the `execute` function is explicitly called. The hook SHALL support cancellation of in-flight requests.

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
The `useReport` hook SHALL use `useApi` internally to fetch report data from the `/api/v1/product/${productId}` endpoint. The hook SHALL provide a convenient wrapper around `useApi` for fetching SBOM report data.

#### Scenario: useReport fetches report data
- **WHEN** a component uses `useReport` hook with a report ID
- **THEN** the hook uses `useApi` internally to fetch from `/api/v1/product/${productId}`
- **AND** the hook returns `{ data, loading, error }`
### Requirement: Debounced Dependency Changes in Paginated API Hook
The `usePaginatedApi` hook SHALL debounce API calls when dependencies in the `deps` array change (excluding the initial mount). The hook SHALL wait for a debounce period of 300ms before executing the API call after a dependency change. This prevents excessive API calls when users are typing in filter input fields, which is the primary use case.

Since the hook cannot distinguish between filter dependencies and pagination dependencies (both are included in the same `deps` array), the debounce SHALL apply to all dependency changes after the initial mount. This means pagination changes will also be debounced by 300ms, which is an acceptable trade-off to solve the filter keystroke problem.

The debounce SHALL only apply to dependency changes after the initial mount. The initial mount SHALL execute immediately without debounce. Polling functionality SHALL skip execution when a debounce is pending (user is actively typing or changing filters) to prevent polling with stale filter values. Polling SHALL resume after the debounce fires and completes.

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

#### Scenario: Polling skips when debounce is pending
- **WHEN** `usePaginatedApi` is configured with `pollInterval` AND a user is actively typing in a filter field (debounce is pending)
- **THEN** polling skips execution during the debounce period
- **AND** polling resumes after the debounce fires and the filter change completes
- **AND** this prevents polling from executing with stale filter values

#### Scenario: Polling continues when no debounce is pending
- **WHEN** `usePaginatedApi` is configured with `pollInterval` AND no debounce is pending (user is not typing)
- **THEN** polling continues to execute at the specified interval
- **AND** dependency changes are still debounced even when polling is active

#### Scenario: Polling preserves pagination and filter settings
- **WHEN** `usePaginatedApi` is configured with `pollInterval` AND polling executes
- **THEN** the polling API call preserves current pagination, sorting, and filter settings from the dependencies
- **AND** the polling uses the same query parameters as the last successful API call

#### Scenario: Polling prevents unnecessary rerenders with shouldUpdate
- **WHEN** `usePaginatedApi` is configured with `pollInterval` and `shouldUpdate` function AND polling executes AND the data has not meaningfully changed
- **THEN** the hook SHALL compare the previous and current data using the `shouldUpdate` function
- **AND** the hook SHALL skip the state update (prevent rerender) if `shouldUpdate` returns false
- **AND** the hook SHALL trigger a rerender if `shouldUpdate` returns true or if `shouldUpdate` is not provided
- **AND** this optimization SHALL prevent UI jumps and visual disruption when the data remains unchanged

