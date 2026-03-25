# upload-spdx-api Specification

## Purpose
Upload spdx SBOM API. **Exhort (Trustify Dependency Analytics)** HTTP usage and analysis JSON triage rules are specified in **`specs/exhort-integration/spec.md`**; this document links to that capability where SPDX upload orchestrates dependency triage.

## Requirements
### Requirement: SPDX File Upload Endpoint
The system SHALL provide a REST endpoint at `/api/v1/products/upload-spdx` that accepts multipart form data containing a vulnerability ID and an SPDX file with optional credentials for private repository access. The endpoint SHALL parse the uploaded file, validate its structure, validate the vulnerability ID format using the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`, validate and store optional credentials when provided, extract product information including CPE metadata, create a product entry, and start async component processing. The endpoint SHALL extract CPE (Common Platform Enumeration) information from the product package's `externalRefs` array where `referenceCategory` is `SECURITY` and `referenceType` is `cpe22Type`, and store it in the product's `metadata` field with the key `cpe`. When credentials are provided, the endpoint SHALL validate them, store them securely, and inject the credential ID into all component reports created from the SPDX file. When validation fails, the endpoint SHALL return a structured error response mapping field names to error messages.

For ProductEndpoint structured SBOM metadata validation errors (returned as `sbomValidationIssues` by the shared exception mapper), each issue entry SHALL include `code`, `configuredProperty`, and `expectedLabels` so clients can render deployment-specific label guidance from backend configuration instead of static frontend lists.

#### Scenario: Successful SPDX upload with CPE extraction
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with a valid vulnerability ID (matching the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`) and a valid SPDX JSON file containing a product package with CPE information in externalRefs
- **THEN** the system validates the vulnerability ID matches the official CVE regex pattern
- **AND** parses the file as JSON
- **AND** validates that the file contains required SPDX structure (SPDXID, relationships, packages)
- **AND** identifies the product package via DESCRIBES relationship
- **AND** extracts CPE from the product package's externalRefs where `referenceCategory` is `SECURITY` and `referenceType` is `cpe22Type`
- **AND** creates a product entry with the CPE value stored in the `metadata` field with key `cpe`
- **AND** starts async processing for all components
- **AND** returns HTTP 202 (Accepted) with the product ID

#### Scenario: Successful SPDX upload without CPE
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with a valid vulnerability ID and a valid SPDX JSON file that does not contain CPE information in the product package's externalRefs
- **THEN** the system processes the upload as described in the successful upload scenario
- **AND** creates a product entry without the `cpe` key in metadata (or with `cpe` set to null)
- **AND** the product is accessible via the products API

#### Scenario: Successful SPDX upload with credentials
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with a valid vulnerability ID, a valid SPDX JSON file, and optional credentials (`secretValue` and optionally `userName`)
- **THEN** the system processes the upload as described in the successful upload scenario
- **AND** validates the provided credentials (SSH private key or Personal Access Token)
- **AND** stores the credentials securely associated with the user
- **AND** injects the credential ID into all component reports created from the SPDX file
- **AND** returns HTTP 202 (Accepted) with the product ID

#### Scenario: Invalid credential rejection
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with invalid credentials (e.g., malformed SSH key or invalid token format)
- **THEN** the system validates the credentials
- **AND** returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object with an `error` field containing a descriptive error message
- **AND** the error message clearly describes the credential validation failure

#### Scenario: Credential storage failure handling
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with valid credentials
- **AND** credential storage fails (e.g., database error)
- **THEN** the system returns HTTP 500 (Internal Server Error)
- **AND** the response body is a JSON object with an `error` field containing a descriptive error message
- **AND** the error message indicates that credential storage failed

#### Scenario: Invalid SPDX file rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with a file that is not valid JSON or missing required SPDX fields
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"file": "error message"` indicating the validation failure
- **AND** the error message clearly describes the validation failure

#### Scenario: Missing vulnerability ID rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` without providing a vulnerability ID
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"cveId": "error message"` indicating the vulnerability ID is required
- **AND** the error message clearly describes that the vulnerability ID is required

#### Scenario: Invalid vulnerability ID format rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with a vulnerability ID that does not match the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"cveId": "error message"` indicating the vulnerability ID format is invalid
- **AND** the error message clearly describes the format requirement

#### Scenario: Missing file rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` without providing a file
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"file": "error message"` indicating the file is required
- **AND** the error message clearly describes that the file is required

#### Scenario: Multiple field validation errors
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-spdx` with both an invalid vulnerability ID and an invalid file
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes both `"cveId": "error message"` and `"file": "error message"`
- **AND** each field maps to its specific validation error message

#### Scenario: Structured SBOM metadata issue entries expose configured keys
- **WHEN** ProductEndpoint returns a structured SBOM metadata validation response containing `sbomValidationIssues`
- **THEN** each issue entry includes `code`, `configuredProperty`, and `expectedLabels`
- **AND** `expectedLabels` values are resolved from the backend property named by `configuredProperty`

### Requirement: Unsupported component handling
When parsing an SPDX file, the system SHALL classify each component (package with PACKAGE_OF relationship to the product) as supported or unsupported. A component is supported only if it has a purl (package URL) that starts with the OCI prefix `pkg:oci/`. Components with no purl or with a purl that does not start with `pkg:oci/` SHALL be considered unsupported. The SPDX parser SHALL add unsupported components to an `unsupportedComponents` list in the parse result. When the parse result contains zero supported components (all components are unsupported or there are no PACKAGE_OF components), the SPDX parser SHALL throw a parse error (validation exception) and the upload endpoint SHALL return HTTP 400 (Bad Request) with the file field mapped to the exact error message: "At least one supported component is required. Supported components are packages with a PACKAGE_OF relationship to the product that have a purl (package URL) starting with pkg:oci. No such components were found." The upload flow SHALL add each unsupported component to the product's `excludedComponents` with `exclusionType` **error** and an informative error message that states what is expected (purl with prefix `pkg:oci/`) and what was provided (the actual purl value, or "missing" if no purl). Async component processing SHALL run only for supported (OCI) components; unsupported components SHALL NOT be sent through the pipeline. The product's `submittedCount` SHALL be the total of all components in the SPDX (supported + unsupported).

#### Scenario: Parser returns unsupported components list for non-OCI purls
- **WHEN** the SPDX parser processes a document that contains a component package with a purl that does not start with `pkg:oci/` (e.g. `pkg:maven/org.foo/bar@1.0`) or a component with no purl
- **THEN** the parser SHALL NOT add that component to the `components` list
- **AND** the parser SHALL add that component to the `unsupportedComponents` list in the parse result
- **AND** the parse result SHALL include both `components` (OCI-only) and `unsupportedComponents`

#### Scenario: Unsupported components recorded in excluded components
- **WHEN** a user submits a valid SPDX file to `/api/v1/products/upload-spdx` that contains one or more components whose purl is missing or does not start with `pkg:oci/`
- **THEN** the system SHALL create the product with `submittedCount` equal to the total number of components (supported + unsupported) and start async processing for supported components only
- **AND** for each unsupported component, the system SHALL add an entry to the product's `excludedComponents` with `exclusionType` **error** and an error message that states what is expected (purl with prefix `pkg:oci/`) and what purl was provided (or that purl is missing)
- **AND** the product SHALL be returned with those entries in `excludedComponents` and with `submittedCount` reflecting all components when the product is fetched via the products API

#### Scenario: No supported components returns parse error
- **WHEN** the SPDX parser processes a document that has no supported components (no PACKAGE_OF components, or every component has no purl or a non-OCI purl)
- **THEN** the parser SHALL throw a parse error (validation exception)
- **AND** the upload endpoint SHALL return HTTP 400 (Bad Request)
- **AND** the response body SHALL include `"file": "At least one supported component is required. Supported components are packages with a PACKAGE_OF relationship to the product that have a purl (package URL) starting with pkg:oci. No such components were found."`

### Requirement: Dependency analytics (Exhort) CVE gate

The system SHALL apply **Exhort dependency analysis invocation** and **Exhort analysis response interpretation for CVE triage** from `specs/exhort-integration/spec.md` when interpreting Exhort for CVE gating. Normative JSON rules (`providers`, `status`, recursive `sources` / `dependencies` / `issues` / `transitive`, **`ExhortCveGateException`**) reside in that specification; this requirement defines **SPDX multi-component upload** orchestration and product/report outcomes.

**Health check before per-component Exhort (SPDX multi-component only):** For SPDX uploads that start async multi-component processing, the system SHALL **not** call Exhort for per-component dependency analytics until the **whole-product Exhort health probe** in **Exhort health probe before SPDX whole-product analysis** has finished. That probe runs **once** after the product document is created and **before** any component enters the Syft / Exhort / agent pipeline. If the probe succeeds, the product SHALL be stored with **`dependencyTriageUnavailable` false** and the per-component behavior below applies. If the probe fails, the product SHALL be stored with **`dependencyTriageUnavailable` true** and the system SHALL **skip all per-component Exhort dependency analytics** for that product run (full agent analysis still proceeds per the health probe requirement). In other words, **`dependencyTriageUnavailable` false** means “health check passed; triage is on,” and **`dependencyTriageUnavailable` true** means “health check failed; triage is off for this run.”

**Per-component Exhort call (when triage is on):** When **`dependencyTriageUnavailable` is false**, before submitting a component to agent analysis the system SHALL run dependency analytics by invoking Exhort as specified in **Exhort dependency analysis invocation** in `specs/exhort-integration/spec.md`, sending the CycloneDX SBOM generated by Syft for that component.

**CVE present vs absent (product outcome):** After a successful **2xx** Exhort response, the system SHALL interpret the response body per **Exhort analysis response interpretation for CVE triage** in `specs/exhort-integration/spec.md`. If the interpretation concludes the submitted vulnerability id **is not present** in the dependency data, the system SHALL add the component to the product's `excludedComponents` with `exclusionType` **dependency_not_present**, SHALL **not** populate the optional **`error`** field on that `ExcludedComponent` (this outcome is not a backend error), and SHALL NOT create, save, or submit the report to agent analysis. If the interpretation concludes the submitted vulnerability id **is present**, the system SHALL proceed with the existing flow (create report data, save report, submit to agent analysis).

**Per-component Exhort operational failure (when triage is on):** If the Exhort call fails as an operational error for that component (non-2xx HTTP, transport failure, empty response, or triage interpretation throws **`ExhortCveGateException`** per `specs/exhort-integration/spec.md`) while dependency triage is active, the system SHALL **not** add that component to `excludedComponents` solely for that failure; it SHALL proceed to create report data, save the report, and submit to agent analysis, and SHALL persist **`componentDependencyTriageFailed` true** on that report document so clients can show that dependency triage failed while full analysis ran (see **Per-report dependency triage unavailability in API responses** in `report-file-upload` and repository reports table specs).

#### Scenario: CVE found in dependency tree — proceed to analysis
- **WHEN** a supported component is processed and Syft has produced a CycloneDX SBOM
- **AND** dependency triage is active for the product (`dependencyTriageUnavailable` is false)
- **AND** the system calls Exhort per **Exhort dependency analysis invocation** with **`cves`** set to include the submitted vulnerability ID
- **AND** **Exhort analysis response interpretation for CVE triage** in `specs/exhort-integration/spec.md` concludes the submitted vulnerability id **is present**
- **THEN** the system SHALL NOT add the component to `excludedComponents`
- **AND** the system SHALL create report data, save the report, and submit it to agent analysis as in the current flow

#### Scenario: CVE not in dependency tree — add to excluded components
- **WHEN** a supported component is processed and Syft has produced a CycloneDX SBOM
- **AND** dependency triage is active for the product (`dependencyTriageUnavailable` is false)
- **AND** the system calls Exhort per **Exhort dependency analysis invocation** with **`cves`** set to include the submitted vulnerability ID
- **AND** **Exhort analysis response interpretation for CVE triage** in `specs/exhort-integration/spec.md` concludes the submitted vulnerability id **is not present**
- **THEN** the system SHALL add the component to `excludedComponents` with `exclusionType` **dependency_not_present**
- **AND** the `ExcludedComponent` entry SHALL omit **`error`** (or serialize it as null); the user-visible explanation for this outcome is defined in the client from **`exclusionType`** only (no paired server message for this path)
- **AND** the system SHALL NOT create, save, or submit a report to agent analysis for that component

#### Scenario: Exhort URL configurable with default
- **WHEN** the application is configured for SPDX dependency triage and health probing
- **THEN** the Exhort base URL configuration SHALL satisfy **Exhort dependency analysis invocation** in `specs/exhort-integration/spec.md`

#### Scenario: Exhort per-component failure while triage active — proceed with triage-failed flag
- **WHEN** a supported component is processed and dependency triage is active for the product (`dependencyTriageUnavailable` is false)
- **AND** the system calls Exhort with the component's CycloneDX and **`cves`** including the submitted vulnerability ID
- **AND** the Exhort request fails (e.g. network error, 4xx/5xx response, empty body), **or** triage interpretation throws **`ExhortCveGateException`** as specified in `specs/exhort-integration/spec.md`
- **THEN** the system SHALL NOT add the component to `excludedComponents` for that failure alone
- **AND** the system SHALL create report data, save the report, and submit it to agent analysis
- **AND** the persisted report SHALL include **`componentDependencyTriageFailed` true**

### Requirement: Exhort health probe before SPDX whole-product analysis
For SPDX uploads that start **async multi-component** processing (`processComponents`), the system SHALL determine whether Exhort is reachable **once** **after** the product document is created (including recording unsupported components) and **before** any component enters the Syft/Exhort/agent pipeline. The probe SHALL use the same configurable Exhort base URL as dependency analytics (`quarkus.rest-client.exhort.url`). The probe request SHALL conform to **Exhort dependency analysis invocation** and **Trustify Dependency Analytics (Exhort) API contract reference** in `specs/exhort-integration/spec.md` (endpoint path, method, and content type for **`POST /api/v5/analysis`**).

**Hosted Exhort caveat:** Many deployments (for example public ingress to `exhort.stage.devshift.net`) **do not expose** standard Quarkus SmallRye **`GET /q/health/*`** endpoints; those routes may return **404**. The health probe for triage gating SHALL therefore **not** use GET health.

**Probe (analysis):** The system SHALL send **`POST`** to **`/api/v5/analysis`** with **`Content-Type: application/vnd.cyclonedx+json`** and a **fixed minimal CycloneDX 1.6** JSON document—the same payload as in `scripts/query-exhort-health.sh` (`MINIMAL_CYCLONEDX`: one-line JSON with `bomFormat` CycloneDX, `specVersion` **1.6**, `version` **1**, and `metadata.component` describing an application named **`health-probe`**). The probe SHALL be classified as **healthy** only when the HTTP response status is **2xx** within the timeout that bounds this probe request.

The probe SHALL be classified as **unhealthy** when the request fails (non-2xx HTTP, or transport/timeout error before a successful classification).

#### Scenario: Healthy Exhort — CVE gate remains
- **WHEN** a valid SPDX upload creates a product and the Exhort analysis probe succeeds and is classified healthy
- **THEN** the product SHALL be stored with **`dependencyTriageUnavailable` false** (or equivalent boolean false in the product model)
- **AND** per-component dependency analytics (POST analysis) and CVE-in-tree gating SHALL behave as in **Dependency analytics (Exhort) CVE gate**

#### Scenario: Unhealthy or failed probe — bypass triage and persist flag
- **WHEN** a valid SPDX upload creates a product and the Exhort analysis probe fails (non-2xx HTTP, or transport/timeout error before a successful classification)
- **THEN** the product SHALL be stored with **`dependencyTriageUnavailable` true**
- **AND** the system SHALL NOT call Exhort dependency analytics for any component of that product for this run
- **AND** each persisted repository report for that product run SHALL have **`componentDependencyTriageFailed` false** (or omit the field; the API SHALL treat omission as false)
- **AND** the system SHALL proceed with full agent analysis for each component that successfully passes SBOM generation and validation (same downstream steps as when the CVE was found in Exhort's tree), without applying the CVE-not-in-tree exclusion for that product

#### Scenario: Analysis probe uses documented minimal CycloneDX
- **WHEN** the system runs the Exhort probe before multi-component processing
- **THEN** the request SHALL be **POST** **`/api/v5/analysis`** with **`Content-Type: application/vnd.cyclonedx+json`**
- **AND** the body SHALL be the minimal CycloneDX document aligned with `scripts/query-exhort-health.sh` (fixed minimal CycloneDX 1.6 JSON as described above)

