# report-audit-trail Specification

## Purpose
TBD - created by archiving change add-report-deletion-audit-trail. Update Purpose after archive.
## Requirements
### Requirement: Append-only report audit collection

The backend SHALL persist report destructive-operation audit records in a dedicated MongoDB collection named `report_audit_trail`. Collection initialization SHALL follow the existing repository pattern: indexes are created at application startup via `@PostConstruct` using idempotent `createIndex` calls. The repository layer SHALL NOT expose generic update or delete APIs. The only permitted mutation of an audit document is setting `deleted` from `false` to `true` after the corresponding report removal succeeds, via `ReportAuditService.deleteSucceeded`.

Each audit document SHALL contain:

- `actor` — authenticated user identifier, service principal name, or `system:purge` for scheduled purge
- `timestamp` — server time when the audit record was created
- `operation` — one of `DELETE_SINGLE`, `DELETE_BULK`, `DELETE_BULK_FILTER`, `DELETE_BY_PRODUCT`, `DELETE_BY_PRODUCTS`, `MODIFY_STATUS`, `DELETE_PURGE`
- `report_ids` — array of affected report MongoDB ObjectId hex strings
- `context` (optional) — operation-specific metadata such as query filters, product IDs, scan ID, error type/message, or purge threshold
- `deleted` — `false` when the audit intent is recorded; `true` only after report removal succeeds

#### Scenario: Collection initialized at startup

- **WHEN** the application starts
- **THEN** `ReportAuditRepositoryService` initializes indexes on `report_audit_trail`
- **AND** the repository does not expose generic update or delete methods

#### Scenario: Audit intent recorded before deletion, confirmed after success

- **WHEN** a report deletion is initiated through `ReportService`
- **THEN** an audit document is inserted into `report_audit_trail` with `deleted=false` before the report delete is applied
- **AND** if audit insertion fails, the destructive operation SHALL NOT proceed
- **AND** when report removal succeeds, `deleted` is updated to `true` via `deleteSucceeded`
- **AND** when report removal fails, the audit document remains with `deleted=false`

### Requirement: Authenticated actor on REST destructive operations

All destructive `ReportEndpoint` handlers (`DELETE /reports/{id}`, `DELETE /reports`, `DELETE /reports/product/{id}`, `DELETE /reports/product`, `POST /reports/failed`) SHALL resolve the caller identity using `SecurityContext` and `UtilitiesService.getAuthenticatedUserName` with `UserService`. The resolved actor SHALL be passed to `ReportService` and stored on the audit record. If no actor can be resolved, the endpoint SHALL return **401 Unauthorized** and SHALL NOT mutate report data.

#### Scenario: Single report delete records authenticated actor

- **WHEN** an authenticated client calls `DELETE /api/v1/reports/{id}`
- **THEN** the backend resolves the caller identity from the security context
- **AND** writes an audit record with operation `DELETE_SINGLE` and `report_ids` containing `{id}`
- **AND** proceeds with report deletion

#### Scenario: Bulk delete by report IDs records authenticated actor

- **WHEN** an authenticated client calls `DELETE /api/v1/reports?reportIds=id1&reportIds=id2`
- **THEN** the backend writes an audit record with operation `DELETE_BULK` and the requested report IDs
- **AND** proceeds with deletion of those reports

#### Scenario: Bulk delete by filter records filter context

- **WHEN** an authenticated client calls `DELETE /api/v1/reports` with query parameters that are not fixed pagination/sort params and without `reportIds`
- **THEN** the backend resolves all matching report IDs before deletion
- **AND** writes an audit record with operation `DELETE_BULK_FILTER`, `report_ids` set to all matches, and `context.filter` capturing the filter map
- **AND** proceeds with deletion of matching reports

#### Scenario: Product-scoped delete records product context

- **WHEN** an authenticated client calls `DELETE /api/v1/reports/product/{id}` or `DELETE /api/v1/reports/product?productIds=...`
- **THEN** the backend resolves report IDs for the product(s)
- **AND** writes an audit record with operation `DELETE_BY_PRODUCT` or `DELETE_BY_PRODUCTS`, the resolved `report_ids`, and `context.product_ids`
- **AND** proceeds with report deletion (and existing product metadata removal)

#### Scenario: Unauthenticated destructive request rejected

- **WHEN** a client calls a destructive report endpoint without a resolvable authenticated actor
- **THEN** the backend returns **401 Unauthorized**
- **AND** no report data is deleted or modified
- **AND** no audit record is written

### Requirement: Owner verification for mark failed by scan ID

`POST /api/v1/reports/failed` (`markFailedByScanId`) SHALL verify ownership before updating report status. For human users (callers without a configured service-account role), every report matching the scan ID SHALL have `metadata.user` equal to the actor. For service accounts (callers holding any role listed in `exploit-iq.security.service-account-roles`), owner verification SHALL be skipped. Service-account detection MUST be role-based and MUST NOT rely on JWT principal type, so it works across OpenShift OAuth and Keycloak. On success, the backend SHALL write an audit record with operation `MODIFY_STATUS`, affected `report_ids`, and `context` containing `scanId`, `errorType`, and `errorMessage`.

#### Scenario: Human user marks own report failed

- **WHEN** an authenticated human user calls `POST /api/v1/reports/failed` for a scan ID whose reports all have `metadata.user` matching the caller
- **THEN** the backend writes a `MODIFY_STATUS` audit record
- **AND** updates the reports with the provided error type and message
- **AND** returns **202 Accepted**

#### Scenario: Human user denied for another user's report

- **WHEN** an authenticated human user calls `POST /api/v1/reports/failed` for a scan ID where any matching report has `metadata.user` different from the caller or missing
- **THEN** the backend returns **403 Forbidden**
- **AND** does not modify any report
- **AND** does not write an audit record

#### Scenario: Service account may mark any matching report failed

- **WHEN** an authenticated service account (holding a configured service-account role such as `exploitiq-api-access`) calls `POST /api/v1/reports/failed` for an existing scan ID
- **THEN** the backend writes a `MODIFY_STATUS` audit record with the service principal as `actor`
- **AND** updates all matching reports
- **AND** returns **202 Accepted**

### Requirement: Scheduled purge audit trail

When the configured purge cron job removes reports via `removeBefore`, the backend SHALL write an audit record with actor `system:purge`, operation `DELETE_PURGE`, `report_ids` listing all deleted report IDs, and `context` containing the purge threshold timestamp.

#### Scenario: Purge job records deleted report IDs

- **WHEN** the scheduled purge job deletes one or more reports older than the configured threshold
- **THEN** the backend writes a `DELETE_PURGE` audit record with actor `system:purge`
- **AND** `report_ids` contains every deleted report ID
- **AND** `context` includes the threshold instant used for the purge

#### Scenario: Purge with zero deletions writes no audit

- **WHEN** the scheduled purge job runs and no reports match the threshold
- **THEN** no audit record is written

