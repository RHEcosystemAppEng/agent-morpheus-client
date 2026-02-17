# report-file-upload Specification

## Purpose
The report file upload capability enables users to upload CycloneDX SBOM files for vulnerability analysis. The system validates the uploaded files, extracts product information, creates reports, and manages product metadata with version information.
## Requirements
### Requirement: CycloneDX File Upload Endpoint
The system SHALL provide a REST endpoint at `/api/v1/products/upload-cyclonedx` that accepts multipart form data containing a CVE ID and a CycloneDX file. The endpoint SHALL parse the uploaded file, validate its structure, validate the CVE ID format using the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`, create a report object with an SBOM report ID, and queue the report for analysis. The endpoint SHALL always generate an SBOM report ID by combining the SBOM name (from `metadata.component.name`) with a timestamp. The endpoint SHALL add the SBOM name (from `metadata.component.name`) to the report metadata as the `sbom_name` field. When validation fails, the endpoint SHALL return a structured error response mapping field names to error messages. The endpoint SHALL create a product entry for every successful upload. When the SBOM contains version information (`metadata.component.version`), the product SHALL use that version. When the SBOM does not contain version information, the product SHALL use an empty string (`""`) as the version value.

#### Scenario: Successful file upload and queuing
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with a valid CVE ID (matching the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`) and a valid CycloneDX JSON file containing `metadata.component.name`
- **THEN** the system validates the CVE ID matches the official CVE regex pattern
- **AND** parses the file as JSON
- **AND** validates that the file contains the `metadata.component.name` field
- **AND** extracts the SBOM name from `metadata.component.name`
- **AND** generates an SBOM report ID by combining the SBOM name with a timestamp
- **AND** creates a report object from the parsed data and CVE ID with the generated SBOM report ID and `sbom_name` field in the report metadata
- **AND** queues the report for analysis
- **AND** returns HTTP 202 (Accepted) with the report data

#### Scenario: Successful file upload with version creates product
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with a valid CVE ID and a valid CycloneDX JSON file containing both `metadata.component.name` and `metadata.component.version`
- **THEN** the system processes the upload as described in the successful file upload scenario
- **AND** creates a product entry with the version from `metadata.component.version`
- **AND** the product is accessible via the products API

#### Scenario: Successful file upload without version creates product with empty string version
- **WHEN** a user submits a multipart form to `/api/v1/products/upload-cyclonedx` with a valid CVE ID and a valid CycloneDX JSON file containing `metadata.component.name` but no `metadata.component.version`
- **THEN** the system processes the upload as described in the successful file upload scenario
- **AND** creates a product entry with an empty string (`""`) as the version
- **AND** the product is accessible via the products API with version set to empty string

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
The system SHALL provide an API endpoint to retrieve full report data by report ID, returning the report data and calculated analysis status as separate fields in a structured response.

#### Scenario: Get full report by ID
- **WHEN** a client calls `GET /api/v1/reports/{id}` with a valid report ID
- **THEN** the API returns a JSON object with two fields: `report` and `status`
- **AND** the `report` field contains the full report data as a JSON object with all report fields: `_id`, `input`, `output`, `info`, and `metadata`
- **AND** the `status` field contains the calculated analysis status as a string value
- **AND** the status value is one of: "completed", "queued", "sent", "expired", "failed", "pending", or "unknown"
- **AND** the status is calculated using the same logic as the `getStatus()` method in `ReportRepositoryService`
- **AND** the status field is included in the response even if the report data is otherwise incomplete
- **AND** the report data is returned without modification (no fields are added or removed from the stored document)

