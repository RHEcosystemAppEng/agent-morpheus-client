# document-titles Specification

## Purpose
Define how the web UI sets `document.title` so tabs show where the user is. Implementation: `src/main/webui/src/pages/pageTitles.ts` and `useDocumentTitle`.
## Requirements
### Requirement: Format and single source
Tab titles SHALL be built only through `pageTitles.ts` helpers, applied with `useDocumentTitle`, and SHALL end with ` | Exploit Intelligence` (via `withAppTitle` / `DOCUMENT_TITLE_APP_NAME`).

#### Scenario: Conventions
- **WHEN** any page sets the document title
- **THEN** it uses `pageTitles.ts` plus `useDocumentTitle` and the string ends with ` | Exploit Intelligence`

### Requirement: Route-specific segments
Titles SHALL follow the patterns implemented in `pageTitles.ts`, including: Home `Home`; reports list `Reports` vs `Reports — Single repositories`; product report `Report: {productName} / {cveId}` when loaded and `Loading Report: {productId} / {cveId}` while loading; repository report CVE plus image name/tag when loaded; CVE details `CVE: {id}` (uppercased), load errors with CVE id, invalid CVE with optional route segment; excluded components `Excluded components — {product} / {cveId}`; plus error/invalid variants defined in that file.

#### Scenario: Product report loading
- **WHEN** the product report page is fetching and the route has `productId` and `cveId`
- **THEN** the document title includes `Loading Report:` with those route values and the app suffix

#### Scenario: CVE details load failure
- **WHEN** CVE details fail to load for a route CVE id
- **THEN** the document title includes that CVE id in the error segment with the app suffix

### Requirement: RPM repository report document title segments

When the repository report page loads successfully for an RPM package checker report (**`report.input.image.pipeline_mode`** is **`rpm_package_checker`**) and **`report.input.image.target_package`** is present, **`document.title`** SHALL include the CVE id and RPM package identity derived from **`target_package`**. The **name**, **version**, and **release`** portion **SHALL** be presented as **hyphenated N-V-R** (**`name-version-release`**) when all three are non-empty after trim (**not** as a space-separated triple). **Architecture** (**`arch`**) **SHALL** appear as a distinct segment in the title suffix (same delimiter pattern as **`pageTitles.ts`** uses for the non-RPM image **name**/**tag** suffix, e.g. em dash after CVE and separator between **N-V-R** and **arch** as implemented), so the tab title **aligns** with **repository-report-page** active-tail formatting.

Titles MUST still follow **`document-titles`** global conventions (constructed via **`pageTitles.ts`** / **`useDocumentTitle`** and the **`Exploit Intelligence`** suffix).

#### Scenario: Loaded RPM checker repository report title

- **WHEN** the repository report page has resolved report data AND **`pipeline_mode`** is **`rpm_package_checker`** AND **`target_package`** has **name**, **version**, **release**, and **arch** populated after trim
- **THEN** **`document.title`** includes **CVE id** and a suffix where **package coordinates use `name-version-release`** (hyphens) **and** **architecture** is visible **without** collapsing **name version release arch** into one space-separated Nevra string
- **AND** the suffix follows **`pageTitles.ts`** conventions with the **Exploit Intelligence** app suffix

