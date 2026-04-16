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
