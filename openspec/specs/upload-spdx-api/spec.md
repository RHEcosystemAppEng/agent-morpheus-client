# upload-spdx-api Specification

## Purpose
TBD - created by archiving change add-cpe-metadata-spdx. Update Purpose after archive.
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
When parsing an SPDX file, the system SHALL classify each component (package with PACKAGE_OF relationship to the product) as supported or unsupported. A component is supported only if it has a purl (package URL) that starts with the OCI prefix `pkg:oci/`. Components with no purl or with a purl that does not start with `pkg:oci/` SHALL be considered unsupported. The SPDX parser SHALL add unsupported components to an `unsupportedComponents` list in the parse result. When the parse result contains zero supported components (all components are unsupported or there are no PACKAGE_OF components), the SPDX parser SHALL throw a parse error (validation exception) and the upload endpoint SHALL return HTTP 400 (Bad Request) with the file field mapped to the exact error message: "At least one supported component is required. Supported components are packages with a PACKAGE_OF relationship to the product that have a purl (package URL) starting with pkg:oci. No such components were found." The upload flow SHALL add each unsupported component to the product's `submissionFailures` with an informative error message that states what is expected (purl with prefix `pkg:oci/`) and what was provided (the actual purl value, or "missing" if no purl). Async component processing SHALL run only for supported (OCI) components; unsupported components SHALL NOT be sent through the pipeline. The product's `submittedCount` SHALL be the total of all components in the SPDX (supported + unsupported).

#### Scenario: Parser returns unsupported components list for non-OCI purls
- **WHEN** the SPDX parser processes a document that contains a component package with a purl that does not start with `pkg:oci/` (e.g. `pkg:maven/org.foo/bar@1.0`) or a component with no purl
- **THEN** the parser SHALL NOT add that component to the `components` list
- **AND** the parser SHALL add that component to the `unsupportedComponents` list in the parse result
- **AND** the parse result SHALL include both `components` (OCI-only) and `unsupportedComponents`

#### Scenario: Unsupported components recorded in submission failures
- **WHEN** a user submits a valid SPDX file to `/api/v1/products/upload-spdx` that contains one or more components whose purl is missing or does not start with `pkg:oci/`
- **THEN** the system SHALL create the product with `submittedCount` equal to the total number of components (supported + unsupported) and start async processing for supported components only
- **AND** for each unsupported component, the system SHALL add an entry to the product's `submissionFailures` with an error message that states what is expected (purl with prefix `pkg:oci/`) and what purl was provided (or that purl is missing)
- **AND** the product SHALL be returned with those entries in `submissionFailures` and with `submittedCount` reflecting all components when the product is fetched via the products API

#### Scenario: No supported components returns parse error
- **WHEN** the SPDX parser processes a document that has no supported components (no PACKAGE_OF components, or every component has no purl or a non-OCI purl)
- **THEN** the parser SHALL throw a parse error (validation exception)
- **AND** the upload endpoint SHALL return HTTP 400 (Bad Request)
- **AND** the response body SHALL include `"file": "At least one supported component is required. Supported components are packages with a PACKAGE_OF relationship to the product that have a purl (package URL) starting with pkg:oci. No such components were found."`

