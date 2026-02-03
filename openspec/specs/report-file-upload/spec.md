# report-file-upload Specification

## Purpose
TBD - created by archiving change add-cyclonedx-upload-api. Update Purpose after archive.
## Requirements
### Requirement: CycloneDX File Upload Endpoint
The system SHALL provide a REST endpoint at `/api/v1/products/upload-cyclonedx` that accepts multipart form data containing a CVE ID and a CycloneDX file. The endpoint SHALL parse the uploaded file, validate its structure, validate the CVE ID format using the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`, create a report object with a product ID, and queue the report for analysis. The endpoint SHALL always generate a product ID by combining the SBOM name (from `metadata.component.name`) with a timestamp. The endpoint SHALL add the SBOM name (from `metadata.component.name`) to the report metadata as the `sbom_name` field. When validation fails, the endpoint SHALL return a structured error response mapping field names to error messages.

#### Scenario: Successful file upload and queuing
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with a valid CVE ID (matching the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`) and a valid CycloneDX JSON file containing `metadata.component.name`
- **THEN** the system validates the CVE ID matches the official CVE regex pattern
- **AND** parses the file as JSON
- **AND** validates that the file contains the `metadata.component.name` field
- **AND** extracts the SBOM name from `metadata.component.name`
- **AND** generates a product ID by combining the SBOM name with a timestamp
- **AND** creates a report object from the parsed data and CVE ID with the generated product ID and `sbom_name` field in the report metadata
- **AND** queues the report for analysis
- **AND** returns HTTP 202 (Accepted) with the report data

#### Scenario: Invalid JSON file rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with a file that is not valid JSON
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"file": "error message"` indicating the file is not valid JSON
- **AND** the error message clearly describes the validation failure

#### Scenario: Missing metadata.component.name field rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with a valid JSON file that does not contain the `metadata.component.name` field
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"file": "error message"` indicating the required field is missing
- **AND** the error message clearly describes which required field is missing

#### Scenario: Missing CVE ID rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` without providing a CVE ID
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"cveId": "error message"` indicating the CVE ID is required
- **AND** the error message clearly describes that the CVE ID is required

#### Scenario: Invalid CVE ID format rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with a CVE ID that does not match the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"cveId": "error message"` indicating the CVE ID format is invalid
- **AND** the error message clearly describes the format requirement

#### Scenario: Missing file rejection with field mapping
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` without providing a file
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes `"file": "error message"` indicating the file is required
- **AND** the error message clearly describes that the file is required

#### Scenario: Multiple field validation errors
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with both an invalid CVE ID and an invalid file
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** the response body is a JSON object mapping field names to error messages
- **AND** the response includes both `"cveId": "error message"` and `"file": "error message"`
- **AND** each field maps to its specific validation error message

### Requirement: Full Report Retrieval API
The system SHALL provide an API endpoint to retrieve full report data by report ID, including the calculated analysis state.

#### Scenario: Get full report by ID
- **WHEN** a client calls `GET /api/v1/reports/{id}` with a valid report ID
- **THEN** the API returns a JSON object containing the full report data
- **AND** the response includes all report fields: `_id`, `input`, `output`, `info`, and `metadata`
- **AND** the response includes a `state` field containing the calculated analysis state of the report
- **AND** the state value is one of: "completed", "queued", "sent", "expired", "failed", "pending", or "unknown"
- **AND** the state is calculated using the same logic as the `getStatus()` method in `ReportRepositoryService`
- **AND** the state field is included in the JSON response even if the report data is otherwise incomplete

