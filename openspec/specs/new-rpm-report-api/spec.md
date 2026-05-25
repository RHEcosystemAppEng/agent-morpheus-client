# new-rpm-report-api Specification

## Purpose
Support RPM analysis
## Requirements
### Requirement: New RPM report REST endpoint
The system SHALL provide a REST endpoint at `POST /api/v1/reports/new-rpm-report` that accepts a JSON body with string fields `name`, `version`, `release`, `arch`, and **`cveId`** (matching the **`upload-spdx-api`** vulnerability ID property name). The endpoint SHALL validate that every listed field is present and non-empty (after trimming surrounding whitespace). The endpoint SHALL validate that **`arch`**, after trim, is exactly one of the allowed RPM architecture literals: **`x86_64`**, **`amd64`**, **`aarch64`**, **`arm64`**, **`ppc64le`**, **`s390x`** (same set as the Request Analysis RPM UI architecture control). The endpoint SHALL validate the CVE identifier using the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$` (case handling SHALL match existing report upload endpoints). When validation fails, the endpoint SHALL return the same style of structured error response as **`POST /api/v1/products/upload-spdx`** for field-level failures: HTTP 400 with a JSON object whose top-level keys are **request field names** and whose values are **human-readable error strings** for each invalid or missing field (see the validation requirement below). The endpoint SHALL construct a Morpheus-compatible report `input` document, persist a new report record, and **always** enqueue or submit the report for Agent Morpheus analysis using the same mechanism as `POST /api/v1/reports/new` **with submission enabled**. The endpoint SHALL NOT accept a `submit` query parameter or support a persist-only mode.

**Persistence rules:**
- The stored report SHALL set `input.image.pipeline_mode` to the string `rpm_package_checker`.
- The stored report SHALL set `input.image.target_package` to an object whose keys are `name`, `version`, `release`, `arch`, and `ecosystem`: the first four SHALL be the corresponding string values from the request (after validation), and `ecosystem` SHALL be the literal string `rpm` (server-defined, not a client-supplied field).
- The value of **`cveId`** SHALL be persisted as the CVE under `input.scan` (e.g. as `vuln_id` on the appropriate element of `input.scan.vulns`), as described in this requirement.

#### Scenario: Successful RPM report creation and queue
- **WHEN** an authenticated client calls `POST /api/v1/reports/new-rpm-report` with a JSON body where `name`, `version`, `release`, `arch`, and `cveId` are all non-empty strings, `arch` is one of the allowed architecture literals, and `cveId` matches `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **THEN** the system persists a new report document whose `input.image.pipeline_mode` is `rpm_package_checker`
- **AND** `input.image.target_package` equals `{ name, version, release, ecosystem: "rpm", arch }` with values derived from the request and `ecosystem` exactly `rpm`
- **AND** the CVE is present under `input.scan` as specified in this requirement
- **AND** the report is enqueued or submitted according to the configured concurrent request pool rules
- **AND** the API returns HTTP 202 (Accepted) with the created report data, consistent with `POST /api/v1/reports/new` success behavior

### Requirement: Validation and error responses for RPM report requests (upload-spdx parity)
For validation failures **only** (`name`, `version`, `release`, `arch`, `cveId`), the endpoint SHALL match **`upload-spdx-api`** field-mapped errors: HTTP 400 (Bad Request) with a JSON object **mapping each offending request property name** to **one human-readable message string** per key (same pattern as **`POST /api/v1/products/upload-spdx`** scenarios “Missing vulnerability ID rejection with field mapping”, “Invalid vulnerability ID format rejection with field mapping”, and “Multiple field validation errors”). Keys SHALL include `name`, `version`, `release`, `arch`, and **`cveId`** for CVE-related failures. When `arch` is present and non-empty after trim but not one of the allowed architecture literals, the response SHALL include key **`arch`** with a message that the value is not allowed and identifies the permitted set (or equivalent clear wording). Responses SHALL NOT use a single top-level `"error"` string for purely field validation failures; each problem field SHALL appear as its own key in the JSON object.

When the request queue limits are exceeded, the endpoint SHALL return HTTP 429 (Too Many Requests) with an error payload consistent with `POST /api/v1/reports/new` (this condition is not a per-field validation case).

#### Scenario: Missing required field with field mapping (upload-spdx style)
- **WHEN** a client calls `POST /api/v1/reports/new-rpm-report` with a JSON body omitting one or more of `name`, `version`, `release`, `arch`, or `cveId`, or supplying only whitespace after trim for any of those properties
- **THEN** the API returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping **field names to error messages**, in the same style as upload-spdx
- **AND** for each absent or whitespace-only required field, the corresponding key (`name`, `version`, `release`, `arch`, or `cveId`) is present with a message that describes the requirement (for example missing or blank)

#### Scenario: Invalid CVE format with field mapping
- **WHEN** a client calls `POST /api/v1/reports/new-rpm-report` with all of `name`, `version`, `release`, and `arch` present and non-empty after trim, `arch` is an allowed architecture literal, but `cveId` does not match `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **THEN** the API returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"cveId": "error message"` indicating the CVE format is invalid (wording analogous to **`upload-spdx-api`** Invalid vulnerability ID scenario)

#### Scenario: Invalid architecture with field mapping
- **WHEN** a client calls `POST /api/v1/reports/new-rpm-report` with `name`, `version`, `release`, and `cveId` valid per other rules but `arch` is a non-empty string after trim that is not one of **`x86_64`**, **`amd64`**, **`aarch64`**, **`arm64`**, **`ppc64le`**, **`s390x`**
- **THEN** the API returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes **`"arch"`** with a message describing that the architecture is not allowed

#### Scenario: Multiple field validation errors
- **WHEN** a client calls `POST /api/v1/reports/new-rpm-report` with more than one validation problem among `name`, `version`, `release`, `arch`, and `cveId` (for example blank `release` together with invalid `cveId`, or invalid `arch` together with invalid `cveId`)
- **THEN** the API returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes an entry per failed field where applicable (e.g. both `"release": "..."` and `"cveId": "..."`)
- **AND** each key maps to the specific validation error for that property (same aggregation rule as **`upload-spdx-api`** “Multiple field validation errors”)

#### Scenario: Queue limit exceeded
- **WHEN** a client submits a valid RPM report request but the internal pending queue is full (same condition as `POST /api/v1/reports/new`)
- **THEN** the API returns HTTP 429 (Too Many Requests)
- **AND** the error payload is consistent with `POST /api/v1/reports/new`

### Requirement: OpenAPI documentation
The new endpoint SHALL be documented in the application OpenAPI/Swagger specification with the JSON request schema (`name`, `version`, `release`, `arch`, `cveId`), where **`arch`** is documented with an **`enum`** (or equivalent OpenAPI enumeration) listing exactly **`x86_64`**, **`amd64`**, **`aarch64`**, **`arm64`**, **`ppc64le`**, **`s390x`**, response schema for HTTP 202 (aligned with existing report creation responses), documented HTTP **400** response describing the **field-name-to-message object** matching upload-spdx-style validation errors, and HTTP **429** consistent with queued report submission.

#### Scenario: Generated client contract
- **WHEN** OpenAPI code generation runs for the frontend client
- **THEN** the request and response types for `POST /api/v1/reports/new-rpm-report` are available to TypeScript consumers without manually duplicating DTO shapes
- **AND** the generated type for **`arch`** reflects the documented enumeration of allowed RPM architectures

### Requirement: Morpheus `input.image` for rpm_package_checker

When the system builds the Morpheus `input` document for **`POST /api/v1/reports/new-rpm-report`**, the persisted **`report.input.image`** for **`rpm_package_checker`** SHALL include these mandatory fields for Agent Morpheus **`ImageInfoInput`** (upstream **`ImageInfoInput`** in the agent codebase’s **`input.py`**):

- **`pipeline_mode`**: literal **`rpm_package_checker`**
- **`analysis_type`**: literal **`source`** (corresponding to **`AnalysisType.SOURCE`**)
- **`target_package`**: populated as described in the **`New RPM report REST endpoint`** requirement ( **`name`**, **`version`**, **`release`**, **`arch`**, **`ecosystem`**: **`rpm`** )

Serialization MUST NOT omit **`analysis_type`** because of **`NON_EMPTY`**-style omission of empty strings or empty collections.

The public request body for **`new-rpm-report`** SHALL remain limited to **`name`**, **`version`**, **`release`**, **`arch`**, and **`cveId`**; the server SHALL supply **`pipeline_mode`**, **`analysis_type`**, and **`target_package`**.

#### Scenario: Stored RPM report JSON includes mandatory image fields

- **WHEN** an authenticated client successfully calls **`POST /api/v1/reports/new-rpm-report`** with valid **`name`**, **`version`**, **`release`**, **`arch`**, and **`cveId`**
- **THEN** the persisted report’s **`report.input.image.pipeline_mode`** is **`rpm_package_checker`**
- **AND** **`report.input.image.analysis_type`** is **`source`**
- **AND** **`report.input.image.target_package`** equals **`{ name, version, release, ecosystem: "rpm", arch }`** as specified in this capability spec

#### Scenario: Morpheus generate accepts rpm checker payload

- **WHEN** the stored **`input`** for a successfully created RPM report is submitted to Agent Morpheus ingest / generate APIs that validate against **`AgentMorpheusInput`** / **`ImageInfoInput`**
- **THEN** validation errors SHALL NOT occur for missing mandatory **`pipeline_mode`**, **`analysis_type`**, or **`target_package`** on **`image`**

