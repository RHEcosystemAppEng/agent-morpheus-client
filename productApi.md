# API Specification: list_product_cve_combinations

## Endpoint
```
GET /product-cves
```

## Summary
Lists all unique product and CVE combinations with their associated report metadata, including submission date, completion date, analysis state, and analysis results summary (counts of vulnerable, uncertain, and not vulnerable components).

## Description
Returns a paginated list of unique product-CVE combinations with report metadata and aggregated analysis results (vulnerable, uncertain, not vulnerable counts).

## Difference from GET /reports/product

Unlike `GET /reports/product` which returns product-centric summaries, this endpoint provides a flattened, CVE-centric view with one entry per product-CVE combination. It includes summary counts instead of full `submissionFailures` arrays (details available in single report view).

## Request

**Query Parameters:**

- `page` (integer, optional, default: 0) - Page number for pagination (0-indexed)
- `pageSize` (integer, optional, default: 100) - Number of items per page
- `sortBy` (string, optional, default: "submittedAt:DESC") - Sort field and direction (format: `field:direction`, fields: `name`, `cveId`, `submittedAt`, `completedAt`, `state`)
- `name` (string, optional) - Filter by product name (partial match)
- `cveId` (string, optional) - Filter by CVE ID (exact match, e.g., "CVE-2024-12345")
- `state` (string, optional) - Filter by analysis state (exact match, e.g., "completed", "pending", "analysing")

## Response

**Status Code:** `200 OK`

**Response Headers:**
- `Content-Type: application/json`
- `X-Total-Pages: <integer>` - Total number of pages
- `X-Total-Elements: <integer>` - Total number of product-CVE combinations

**Response Body:**
```json
[
  {
    "name": "MyProduct",
    "cveId": "CVE-2024-12345",
    "submittedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T11:45:00Z",
    "state": "completed",
    "vulnerableCount": 5,
    "uncertainCount": 2,
    "notVulnerableCount": 8,
    "submissionFailureCount": 1,
    "reportFailureCount": 0,
    "total": 15,
    "queued": 0
  },
]
```

**Response Fields:**

- `name` (string, required) - Product name
- `cveId` (string, required) - CVE ID (e.g., "CVE-2024-12345")
- `submittedAt` (string, required) - Report submission timestamp (ISO 8601 format)
- `completedAt` (string, optional) - Report completion timestamp (ISO 8601 format). Null if analysis is still in progress.
- `state` (string, required) - Analysis state of the report. Possible values: "pending", "queued", "sent", "analysing", "completed", "failed"
- `vulnerableCount` (integer, required) - Number of components analyzed as vulnerable (justification status: "true")
- `uncertainCount` (integer, required) - Number of components analyzed as uncertain (justification status: "unknown")
- `notVulnerableCount` (integer, required) - Number of components analyzed as not vulnerable (justification status: "false")
- `submissionFailureCount` (integer, required) - Number of components that failed to be processed for scanning. Full failure details are available in the individual report view.
- `reportFailureCount` (integer, required) - Number of reports that failed during analysis
- `total` (integer, required) - Total number of components in the SBOM for this product-CVE combination
- `queued` (integer, required) - Number of components currently queued for analysis

## Behavior

Retrieves all reports, extracts product-CVE combinations, aggregates analysis results (counts vulnerable/uncertain/not vulnerable components), resolves product names, applies filters and sorting, then returns paginated results.

## Error Responses

### 400 Bad Request
- Invalid query parameter format
- Invalid sort field or direction

**Response Body:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid sortBy parameter. Supported fields: name, cveId, submittedAt, completedAt, state",
    "details": {
      "field": "sortBy",
      "value": "invalidField:ASC"
    }
  }
}
```

### 500 Internal Server Error
- Unexpected server error during processing

**Response Body:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while processing your request",
    "requestId": "req-123456789"
  }
}
```

## Example Request

```bash
curl -X GET "https://api.example.com/product-cves?name=MyProduct&cveId=CVE-2024-12345" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

- Each product-CVE combination appears once; multiple reports are aggregated (counts summed, most recent metadata used)
- `completedAt` and analysis counts are `null`/`0` for in-progress reports

