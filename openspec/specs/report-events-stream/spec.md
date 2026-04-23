# report-events-stream Specification

## Purpose
Push **catalog** invalidation from the Quarkus app to the browser so report/product views refetch REST over SSE (no timer-based polling in the web UI).
## Requirements
### Requirement: Authenticated SSE endpoint
The backend SHALL expose `GET /api/v1/reports/stream` returning `text/event-stream` with JSON `data` frames, authenticated like other `/api/v1` routes, and SHALL emit `catalog` events after report or product documents are written in MongoDB.

#### Scenario: Callback drives UI refresh
- **WHEN** the agent completes analysis and this app persists report/product changes
- **THEN** connected browsers receive an event and MAY refetch their current REST queries

### Requirement: Coarse catalog events
Events SHALL use type `catalog` for any list-affecting change; clients refetch; payloads stay minimal.

#### Scenario: No agent SSE
- **WHEN** operators deploy the agent
- **THEN** they do not configure SSE on the agent; only this app streams to browsers
