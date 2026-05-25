# request-analysis-modal-rpm-fields Specification

## Purpose

**RPM** mode fields: hyphenated Package **N-V-R**, architecture selection, **`POST /api/v1/reports/new-rpm-report`** submit, success navigation and field-level **400** handling. Modal shell behaviors (CVE ID validation, keyboard **Enter**, mode switching, when private-repository UI applies) defer to **`request-analysis-modal`** and are not redefined here except where this spec states RPM-specific overrides.

Sibling mode specs: [SBOM](../request-analysis-modal-sbom/spec.md), [Single Repository](../request-analysis-modal-single-repository/spec.md). Root modal: [`request-analysis-modal`](../request-analysis-modal/spec.md).

## Implementation (non-normative)

Form logic: `src/main/webui/src/hooks/useAnalysisRequestForm.ts`; validation helpers aligned with **`request-analysis-modal`** RPM handling; Presentation: `src/main/webui/src/components/request-analysis/` (RPM field subcomponents alongside existing mode fields).
## Requirements
### Requirement: RPM mode layout and controls

RPM mode SHALL present the shared CVE ID field (per **`request-analysis-modal`**), a **`TextInput`** for the RPM package whose **`FormGroup` label text** is exactly **`Package N-V-R`** (no parenthetical suffix on the label). The **`TextInput` placeholder** SHALL be a **concrete example N-V-R** in **`name-version-release`** form (for example **`openssl-3.0.7-5.el9`**) so users see delimiter pattern and segment shape. Below the input, **`FormHelperText`** with **`HelperText`** SHALL include **at least one non-error `HelperTextItem`** that explains that the value is **hyphen-separated package name, version, and release** (brief wording acceptable). When client validation reports a package error, an error **`HelperTextItem`** SHALL also appear; the non-error explanatory helper SHOULD remain visible when an error is shown unless product accessibility copy rules require otherwise. An **Architecture** control SHALL provide the distinct selectable string values **`x86_64`**, **`amd64`**, **`aarch64`**, **`arm64`**, **`ppc64le`**, **`s390x`**, with **`x86_64`** as the initial default when RPM is selected or when the architecture is reset entering RPM mode. Those six values SHALL be the only architectures accepted by **`POST /api/v1/reports/new-rpm-report`** for field **`arch`** (per **`new-rpm-report-api`**). RPM mode SHALL NOT show SBOM `FileUpload` or Single Repository URL / Commit ID controls.

#### Scenario: RPM shows only RPM-specific inputs

- **WHEN** the user selects **RPM** on the mode toggle
- **THEN** CVE ID, the **Package N-V-R** field, and Architecture are visible per this requirement
- **AND** SBOM file and Single Repository fields are not shown

#### Scenario: Package N-V-R field shows label, example placeholder, and helper text

- **WHEN** the user views RPM mode with no package validation error active
- **THEN** the package field label reads **Package N-V-R**
- **AND** the **`TextInput` placeholder** shows a concrete **name-version-release** example (such as **`openssl-3.0.7-5.el9`**)
- **AND** non-error helper text below the field explains hyphen-separated **name**, **version**, and **release**

### Requirement: Client NVR validation and parsing

The client SHALL validate the trimmed Package value on **blur** and on **submit** (and **Enter** SHALL follow the same validation path as blur per parent modal **Keyboard Enter** requirement). Valid input SHALL decompose into three non-empty strings **`name`**, **`version`**, and **`release`** using RPM-style parsing: the substring after the **last** hyphen is **`release`**, the substring between the **last two** hyphens is **`version`**, and the leading remainder is **`name`** (the **`name`** segment MAY itself contain hyphens). If the trimmed value cannot be parsed into three non-empty segments (for example fewer than two hyphens in the trimmed value), the field SHALL show a human-readable error explaining that the value must be **`name-version-release`**.

#### Scenario: Valid NVR accepted

- **WHEN** the user enters a trimmed value such as **`openssl-3.0.7-5.el9`**
- **AND** blur or submit validation runs
- **THEN** no Package format error is shown
- **AND** the derived **`name`**, **`version`**, and **`release`** are **`openssl`**, **`3.0.7`**, and **`5.el9`** respectively

#### Scenario: Too few hyphens rejected

- **WHEN** the user enters **`openssl-3.0.7`** (only one hyphen)
- **AND** blur or submit validation runs
- **THEN** a Package error is shown and submit is blocked until fixed

### Requirement: RPM submit via new-rpm-report

On submit with valid client-side checks, the client SHALL call **`POST /api/v1/reports/new-rpm-report`** using the generated API client and **`useApi`**, with JSON body **`name`**, **`version`**, **`release`**, **`arch`**, and **`cveId`** where the first four come from parsed NVR and selected architecture (one of the six values defined for the Architecture control) and **`cveId`** is the trimmed CVE string. Field-level HTTP **400** responses whose body maps field names to messages SHALL surface messages on the corresponding controls when the key is **`name`**, **`version`**, **`release`**, **`arch`**, or **`cveId`**. On success (**HTTP 202**), the application SHALL navigate to **`/reports/component/:cveId/:reportId`** using identifiers from the response body in the same way Single Repository success uses **`POST /api/v1/reports/new`**, and SHALL close the modal.

#### Scenario: Successful RPM request navigates to component report

- **WHEN** the user submits valid CVE, NVR, and architecture
- **AND** the API returns **202** with report identifiers
- **THEN** the client navigates to the component report route for that CVE and report
- **AND** the modal closes

#### Scenario: Field-mapped 400 shows per-field errors

- **WHEN** the API returns **400** with a JSON object mapping for example **`release`** to an error string
- **THEN** that message is shown in context for the Package field or otherwise clearly associated with the failing segment per existing form error patterns
- **AND** the modal stays open with values preserved

#### Scenario: Field-mapped 400 for invalid architecture

- **WHEN** the API returns **400** with a JSON object mapping **`arch`** to an error string (for example after a contract mismatch or direct API use)
- **THEN** that message is shown on the Architecture control
- **AND** the modal stays open with values preserved

### Requirement: RPM field state on mode changes

When the user switches **from** RPM **to** another mode, RPM-specific field values (Package text, architecture other than default) and RPM-specific field errors SHALL be cleared or reset so the prior mode’s rules apply without stale RPM errors. When switching **to** RPM from another mode, Package SHALL start empty and Architecture SHALL be **`x86_64`** unless product rules preserve user preference elsewhere (default: reset as stated).

#### Scenario: Leave RPM clears RPM inputs

- **WHEN** the user had entered Package text in RPM mode
- **AND** the user switches to **SBOM**
- **THEN** Package value and any Package error are cleared

