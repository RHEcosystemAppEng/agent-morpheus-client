# exhort-integration Specification

## Purpose

Normative requirements for integrating with **Trustify Dependency Analytics** (Exhort) **API v5**: contract reference, how the backend invokes analysis, and how **analysis JSON** is interpreted for **CVE dependency triage** (aggregate `providers` validation, recursive issue walk, operational failure handling).

**Related:** SPDX product upload flow that **schedules** Exhort health probe and per-component triage is defined in **`specs/upload-spdx-api/spec.md`** (**Dependency analytics (Exhort) CVE gate** and **Exhort health probe before SPDX whole-product analysis**).

## Requirements

### Requirement: Trustify Dependency Analytics (Exhort) API contract reference

The system SHALL treat the Exhort **HTTP API v5** contract as described by the **OpenAPI reference copy** in this repository at **`docs/reference/exhort-trustify-da-api-v5-openapi.yaml`**, maintained as a snapshot for offline review and diffing. The authoritative upstream specification remains **[trustify-da-api-spec](https://github.com/guacsec/trustify-da-api-spec)** (`api/v5/openapi.yaml` on the main branch unless otherwise pinned).

#### Scenario: Engineers locate the OpenAPI snapshot

- **WHEN** a developer needs to confirm paths, query parameters, or response schemas for Exhort v5 in this codebase
- **THEN** they SHALL find the checked-in OpenAPI document at `docs/reference/exhort-trustify-da-api-v5-openapi.yaml`
- **AND** they SHALL treat that file as the primary local reference, reconciling any drift with the upstream trustify-da-api-spec repository before changing client behavior

### Requirement: Exhort dependency analysis invocation

The system SHALL call Exhort using **`POST /api/v5/analysis`** with **`Content-Type: application/vnd.cyclonedx+json`** and a CycloneDX document as the request body. The system SHALL support the optional **`cves`** query parameter (comma-separated CVE ids per OpenAPI v5) so analysis can be scoped to submitted vulnerability ids. The Exhort base URL SHALL be configurable (for example via `quarkus.rest-client.exhort.url`); the default SHALL be **`https://exhort.stage.devshift.net`**.

#### Scenario: Per-component analysis uses CycloneDX and CVE filter

- **WHEN** the system performs per-component dependency analysis against Exhort for CVE triage
- **THEN** it SHALL send **`POST /api/v5/analysis`** with a CycloneDX JSON body
- **AND** it SHALL set the **`cves`** query parameter to a comma-separated list that includes at least the submitted vulnerability id for the product, when triage requires that scope

### Requirement: Exhort analysis response interpretation for CVE triage

For each Exhort **2xx** analysis response body used for **CVE triage**, the root SHALL be a JSON object. The system SHALL require a **`providers`** property whose value is a **JSON object with at least one property** (at least one provider id). If **`providers`** is missing, null, not an object, or an **empty object**, the system SHALL treat the response as **not reliably interpretable for CVE gating** and SHALL throw **`ExhortCveGateException`** (callers apply operational triage-failure handling: proceed with analysis and **`componentDependencyTriageFailed` true** where that pattern applies).

The system SHALL evaluate **every** provider entry under **`providers`**. For each provider report object, the system SHALL require a **`status`** object with **`ok` equal to true** (JSON boolean). If **`status`** is missing or not an object, or **`ok`** is missing, null, or not true, the system SHALL throw **`ExhortCveGateException`**.

For each provider report, **`status.warnings`** SHALL be treated as **empty** only when **`warnings`** is null, missing, an **empty JSON object**, or an **empty JSON array**. If **`warnings`** is non-empty (any property on an object, or any element in an array), or **`warnings`** is present but neither an object nor an array, the system SHALL throw **`ExhortCveGateException`**.

After the aggregate checks above pass, the system SHALL determine whether a **submitted vulnerability id** appears in the analysis response by walking **all** providers and, for each provider, recursively examining dependency data:

- If a provider’s **`sources`** property is null or missing, that provider contributes **no** dependency rows from sources for this walk.
- If **`sources`** is an object, the system SHALL visit each source value. For each source, if **`dependencies`** is null or missing, the system SHALL treat that source as having **no** dependency rows. If **`dependencies`** is an array, the system SHALL visit each dependency report element.
- For each dependency report (direct or nested inside **`transitive`**): if **`issues`** is null, missing, or an empty array, there are **no** issues on that row. Otherwise the submitted vulnerability id **matches** an issue when it equals **`id`** after trimming or appears as a string in **`cves`** after trimming.
- If **`transitive`** is null, missing, or an empty array, there is **no** further nested subtree. Otherwise the system SHALL apply the same rules recursively to each transitive dependency report element.

If **`dependencies`**, **`issues`**, or **`transitive`** is present but not an array where an array is required for traversal, the system SHALL throw **`ExhortCveGateException`**.

**Per-component operational interpretation failure:** If the response cannot be parsed for CVE gating **including** **`ExhortCveGateException`** from aggregate checks or recursive interpretation, callers that define operational triage failure SHALL **not** treat the component as **`dependency_not_present`** solely on that basis; they SHALL apply their documented triage-failed path (for SPDX uploads, see **Dependency analytics (Exhort) CVE gate** in `specs/upload-spdx-api/spec.md`).

#### Scenario: Reliable response — CVE id matches an issue under any provider

- **WHEN** the analysis JSON has a non-empty **`providers`** object
- **AND** every provider has **`status.ok` true** and **`status.warnings`** empty per the rules above
- **AND** the submitted vulnerability id matches at least one issue under any provider’s **`sources`** in the recursive walk (`issues` / `transitive`)
- **THEN** the triage interpretation SHALL conclude the CVE **is present** in the returned dependency data

#### Scenario: Reliable response — CVE id matches no issue

- **WHEN** the analysis JSON satisfies the aggregate reliability rules (non-empty **`providers`**, all providers **`status.ok` true**, all **`status.warnings`** empty)
- **AND** the submitted vulnerability id matches **no** issue in the recursive walk across all providers (including when **`sources`**, **`dependencies`**, **`issues`**, or **`transitive`** are null or missing at any level)
- **THEN** the triage interpretation SHALL conclude the CVE **is not present** in the returned dependency data

#### Scenario: Unreliable response — missing or empty providers

- **WHEN** the body is valid JSON but **`providers`** is missing, not an object, or an object with **no keys**
- **THEN** the system SHALL throw **`ExhortCveGateException`** (or equivalent) for triage interpretation
- **AND** the CVE **SHALL NOT** be classified as **not present** solely from that response

#### Scenario: Unreliable response — provider not ok or warnings not empty

- **WHEN** the body has a non-empty **`providers`** map
- **AND** at least one provider report has **`status.ok`** not true, or **`status.warnings`** not empty per the aggregate rules above
- **THEN** the system SHALL throw **`ExhortCveGateException`** for triage interpretation
- **AND** the CVE **SHALL NOT** be classified as **not present** solely from that response
