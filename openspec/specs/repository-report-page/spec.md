# repository-report-page Specification

## Description

Saved repository vulnerability report page: breadcrumbs, **CVE repository report details** (**`DetailsCard`**) with distinct **artifact details** for container vs **RPM checker** reports, **Analysis Details** markdown section (all report types), downloads, SSE.

## Purpose

**CVE** everywhere on the page comes from the route parameter **`cveId`** (**Repository report page CVE identity**). **`DetailsCard`** omits **CVSS** for every API **`status`**. **`failed`**/**`expired`** strips analysis rows **after artifact details** and **ChecklistCard** (non-RPM); see **Failing API status**.
## Requirements
### Requirement: Repository report page CVE identity

The page **SHALL** treat the route parameter **`cveId`** as **Repository report page CVE identity**. **CVE** labels, **`DetailsCard`** CVE display and link targets, breadcrumb **CVE** fragments, page title **CVE** fragments, and **`output.analysis`** row selection **SHALL** use that route **`cveId`**. **`report.input.scan.vulns`** **SHALL NOT** override route **`cveId`** for those purposes. **`output.analysis[*].vuln_id`** **SHALL NOT** be used alone to determine which CVE the page is for.

#### Scenario: Identity wires **`output`** and **`DetailsCard`**

- **WHEN** the user opens a repository report URL with **`cveId`**
- **THEN** **`output.analysis`** lookups **SHALL** use the row whose **`vuln_id`** equals route **`cveId`**
- **AND** **`DetailsCard`** CVE **SHALL** display and link using route **`cveId`**

### Requirement: Repository Report Page Routes

The page **SHALL** support **`/reports/product/:productId/:cveId/:reportId`**, **`/reports/component/:cveId/:reportId`**, and legacy **`/reports/:productId/:cveId/:reportId`**.

#### Scenario: Path shapes

- **WHEN** any supported URL **THEN** the page **SHALL** load **AND** product URLs **SHALL** include the extra SBOM breadcrumb segment that component URLs omit

### Requirement: RPM package checker detection

**RPM checker** branching on the repository report page SHALL follow **rpm-package-checker-report** (normative **`pipeline_mode`** rule). **repository-report-page** RPM behaviors (**breadcrumb tail**, **artifact details**, **Details** section, failing omissions) SHALL apply **only** for reports classified as RPM checker under that capability. Otherwise non-RPM **artifact** and **`DetailsCard`** rules SHALL apply.

#### Scenario: Mode

- **WHEN** a loaded report qualifies as **RPM checker** per **rpm-package-checker-report**
- **THEN** **RPM** branches **apply**

- **WHEN** a loaded report does not qualify as RPM checker per **rpm-package-checker-report**
- **THEN** non-RPM **artifact** and **`DetailsCard`** rules SHALL apply

### Requirement: Breadcrumb — what appears and data sources

The page **SHALL** render breadcrumb segments in this **order**: **Reports** (always) → **SBOM parent** (product URL only) → **active tail** (always last, not a link).

1. **Reports:** static label, target **`/reports`**.
2. **SBOM parent** (only **`/reports/product/:productId/:cveId/:reportId`**): shows **`{product}/{CVE}`**, target **`/reports/product/:productId/:cveId`**. **`product`** **SHALL** be **`report.metadata.product_id`**, else route **`productId`**. **`CVE`** label **SHALL** be route **`cveId`** (**CVE identity**).
3. **Active tail:** **`{CVE} | {name} | {tag}`**. **`CVE`** **SHALL** be route **`cveId`** (**not** from **`output.analysis`** alone). **`name`**/**`tag`** **SHALL** be **`report.input.image.name`**/**`tag`**, **empty string** if missing. **RPM checker** with **`target_package`**: if **`name`**/**`tag`** would be empty placeholders, the active tail **SHALL NOT** join **`target_package`** **name**, **version**, **release**, and **arch** with spaces. Instead it **SHALL** use **`{CVE} | {N-V-R} | {arch}`** where **{N-V-R}** is **`name`**, **`version`**, and **`release`** joined by hyphen **U+002D** when all three are non-empty after trim (**same hyphenation rule as the DetailsCard Package row**), **{arch}** is **`target_package.arch`** trimmed or **empty string** if missing, preserving three **`|`-separated** visual slots (**CVE**, **N-V-R slot**, **architecture slot**). If **N-V-R** cannot be formed (any of **name**/**version**/**release** missing or blank after trim), **{N-V-R}** **SHALL** be **empty string**. The **same active-tail string** (**`{CVE} | … | …`**) **SHALL** drive the **CVE Repository Report** **`h1`** subtitle segment that follows the **CVE Repository Report:** prefix.

**Clicks:** **Reports** → **`/reports`** SBOM middle → **`/reports/product/:productId/:cveId`**.

#### Scenario: Product vs component

- **WHEN** product URL **THEN** **SHALL** render segments 1–3

- **WHEN** component URL **THEN** **SHALL** render segments 1 and 3 only

#### Scenario: RPM checker breadcrumb uses N-V-R, not space-separated Nevra

- **WHEN** the loaded report is **RPM checker** and **`target_package`** has **name**, **version**, **release**, and **arch** present after trim
- **THEN** the active tail **SHALL** show **`{CVE} | {name-version-release} | {arch}`** with hyphens between **name**, **version**, and **release**
- **AND** **SHALL NOT** render **`{CVE} | name version release arch`** as a single spaced Nevra blob

### Requirement: Unavailable and missing values

**Default:** **`DetailsCard`** values **SHALL** show **`Not available`** when the backing field is missing, blank after trim, or unusable, unless this spec specifies otherwise (e.g. breadcrumb uses **empty string** for missing **`name`**/**`tag`** slots). **Feedback** hidden unless **`status`** **`completed`** is normal, not **`Not available`**.

#### Scenario: **`DetailsCard`** gap

- **WHEN** a **`DetailsCard`** source is absent **THEN** the page **SHALL** show **`Not available`**

### Requirement: Primary details card — artifact details and fields

The **`DetailsCard` SHALL** group fields into an **analysis block** (Finding and AI output) and an **identity block** (**CVE** and **artifact details**), separated by a PatternFly **`Divider`** when the analysis block is shown.

**Analysis block** (shown when **not** **Failing API status**):

1. **Finding** — API **`status`** + **`output.analysis.justification.status`** when row exists (**Failed** matches findings tables on **`failed`**/**`expired`**).
2. **Justification** — **`output.analysis.justification.label`**.
3. **Reason** — **`output.analysis.justification.reason`** as markdown.
4. **Summary** — **`output.analysis.summary`** as markdown.
5. **Intel Reliability Score** — **`output.analysis.intel_score`**.

**Divider** — PatternFly **`Divider`** **SHALL** render **after** the analysis block and **before** the identity block when the analysis block is shown. **SHALL NOT** render on **Failing API status**.

**Identity block** (always shown when the card is shown, subject to failing truncation of analysis only):

6. **CVE** — route **`cveId`**, internal link (**CVE identity**).
7. **Artifact details** — **non-RPM**: **Repository URL** + **Image**; **RPM**: **Package** + **Architecture** + **RPM package URL** (per rules below). **Artifact details** **SHALL** follow **CVE** (not precede it).

**Repository URL** (**non-RPM**): from first **`source_info`** with **`type === code`**. **`git_repo`** + **`ref`** **SHALL** → external link **`{normalizedBase}/commit/{ref}`** (trim **`/`**, strip **`.git`** from base, visible text = URL). **`git_repo`** only **SHALL** → link to **`git_repo`**. Else **`Not available`**.

**Image** (**non-RPM**, inside **artifact details**): pull-style plaintext from **`report.input.image`** (registry vs **source**/URL rules); **`Not available`** when not pullable.

**RPM artifact details:** **Package** **SHALL** be **`name`-`version`-`release`** (hyphen U+002D) **only if** all three on **`report.input.image.target_package`** are non-empty after trim **else** **`Not available`**. **Architecture** **SHALL** be **`target_package.arch`** or **`Not available`**. **RPM package URL** **SHALL** be **`report.info.checker_context.artifacts.source_url`** as an external hyperlink when that value is non-empty after trim **else** **`Not available`**.

**ChecklistCard** **SHALL NOT** appear when failing (non-RPM). For **RPM**, **ChecklistCard** **SHALL NOT** appear for any **`status`**. **`DetailsCard`** **SHALL NOT** render **CVSS Score**.

#### Scenario: Non-RPM completed

- **WHEN** not **RPM** and not failing
- **THEN** **`DetailsCard` SHALL** show the analysis block in order **Finding**, **Justification**, **Reason**, **Summary**, **Intel Reliability Score**
- **AND** **SHALL** show a PatternFly **`Divider`**
- **AND** **SHALL** show **CVE**, then **Repository URL**, then **Image**
- **AND** **SHALL NOT** show **CVSS**

#### Scenario: RPM completed

- **WHEN** **RPM** and not failing
- **THEN** **`DetailsCard` SHALL** show the same analysis block and **`Divider`** as non-RPM
- **AND** **SHALL** show **CVE**, then **Package**, **Architecture**, and **RPM package URL** in that order
- **AND** **SHALL NOT** show **Repository URL** or **Image**

#### Scenario: RPM package URL absent

- **WHEN** **`report.info.checker_context.artifacts.source_url`** is absent, empty, or blank after trim
- **THEN** **`DetailsCard` SHALL** show **`Not available`** for **RPM package URL**

#### Scenario: No divider without analysis block

- **WHEN** **Failing API status** applies
- **THEN** **`DetailsCard` SHALL NOT** render the **`Divider`**
- **AND** **SHALL NOT** render analysis-block rows (**Justification**, **Reason**, **Summary**, **Intel Reliability Score**)

### Requirement: Failing API status

On **`failed`**/**`expired`**, **`DetailsCard` SHALL** keep **Finding** (**Failed**), **Failure reason**, **CVE**, and **artifact details** only. **Failure reason** **SHALL** appear immediately after **Finding**. **SHALL NOT** show the analysis block, **`Divider`**, **Justification**, **Reason**, **Summary**, or **Intel Reliability Score**. For **non-RPM**, **artifact details** **SHALL** include **Repository URL** and **Image** after **CVE**. For **RPM**, **artifact details** **SHALL** include **Package**, **Architecture**, and **RPM package URL** in that order after **CVE** (**no** **Image**). **Non-RPM** **SHALL NOT** show **ChecklistCard**. **RPM** **SHALL NOT** show **RpmRelatedLinksSection**. The **Analysis Details** section **SHALL NOT** appear when failing (any report type). **`RepositoryAdditionalDetailsCard` SHALL** still render (**including** **RPM** failures), subject to **`RepositoryAdditionalDetailsCard`** placement and CVSS omission.

The page **SHALL** run SSE refetches **while** **`status`** is **neither** **`completed`** **nor** **`failed`**. **SHALL** stop SSE-driven refetch when **`status`** is **`completed`** or **`failed`**. **SHALL** apply state updates after refetch **only** when **`status`** changes.

#### Scenario: Truncated **`DetailsCard`** (non-RPM)

- **WHEN** **`failed`** or **`expired`** and **not** **RPM**
- **THEN** **`DetailsCard` SHALL** show **Finding**, **Failure reason**, **CVE**, **Repository URL**, and **Image** in that order
- **AND** **SHALL NOT** show **`Divider`**, **Intel**, **Justification**, **Reason**, or **Summary**

#### Scenario: Truncated **`DetailsCard`** (RPM)

- **WHEN** **`failed`** or **`expired`** and **RPM**
- **THEN** **`DetailsCard` SHALL** show **Finding**, **Failure reason**, **CVE**, **Package**, **Architecture**, and **RPM package URL** in that order
- **AND** **SHALL NOT** show **`Divider`**, **Intel**, **Justification**, **Reason**, or **Summary**

### Requirement: **`RepositoryAdditionalDetailsCard`** placement and CVSS omission

The page **SHALL** render **`RepositoryAdditionalDetailsCard`** (expandable **Additional Details**) **after **`DetailsCard`** for **RPM checker** **and** **non-RPM** repository reports whenever the repository report grid is shown (**including** **Failing API status** (**`failed`**/**`expired`**)). **`RepositoryAdditionalDetailsCard`** **SHALL NOT** display **CVSS Vector String** (**`output.analysis.cvss.vector_string`** or equivalent) **or** any **`DescriptionList`** row labeled for **CVSS** vector strings, for either mode.

#### Scenario: **`RepositoryAdditionalDetailsCard`** on **RPM** and **non-RPM**

- **WHEN** the repository report grid is shown **and** **RPM checker** **or** **non-RPM** **THEN** **`RepositoryAdditionalDetailsCard` SHALL** render

#### Scenario: **`RepositoryAdditionalDetailsCard`** when **Finding** truncated

- **WHEN** **`failed`** **or** **`expired`** **THEN** **`RepositoryAdditionalDetailsCard` SHALL** still render

#### Scenario: No **CVSS** vector row in **Additional Details**

- **WHEN** **`RepositoryAdditionalDetailsCard`** is expanded
- **THEN** the page **SHALL NOT** show **CVSS Vector String**

### Requirement: Analysis Details section

When **not** failing, the page **SHALL** render an **Analysis Details** section for **all** report types (RPM checker **and** non-RPM) when **`output.analysis.details`** is non-empty after trim for the **`output.analysis`** row selected by **CVE identity** (route **`cveId`**). The section renders the value as markdown using **`VulnerabilityPatchDetailsSection`**, with PatternFly **`CodeBlock`**/**`CodeBlockCode`** for fenced code blocks. When **`details`** is absent, blank, or empty after trim, the section **SHALL NOT** render (no **`Not available`** placeholder). The page **SHALL** set the page subtitle so **CVE** (route **`cveId`**) plus artifact label uses **`target_package`** formatted **as N-V-R and architecture segments consistent with** the **active tail** (hyphenated **name-version-release** and **architecture** slot, **not** space-separated **name version release arch**) for RPM reports.

#### Scenario: **`details`** populated

- **WHEN** non-empty **`details`** after trim **AND** not failing **THEN** the page **SHALL** render the **Analysis Details** section with markdown content, for both RPM and non-RPM reports

#### Scenario: **`details`** empty

- **WHEN** absent, blank, or empty after trim **THEN** the **Analysis Details** section **SHALL NOT** render

### Requirement: Alert, downloads, feedback

The repository report page **SHALL** show an **Alert** under **`h1`**, above cards: **AI usage notice** / **Always review AI generated content prior to use.**

The page **SHALL** provide **Download**. **VEX** **SHALL** use filename **`vex-{cveId}-{reportId}.json`**, **SHALL** be enabled when **`report.output.vex`** is present, and **SHALL** be disabled when **`report.output.vex`** is absent. **Report** **SHALL** always be enabled with filename **`report-{cveId}-{reportId}.json`** (full JSON).

The page **SHALL** show **Feedback** after **RepositoryAdditionalDetailsCard** only when **`status`** is **`completed`** (copy per feedback-report).

#### Scenario: Feedback when done

- **WHEN** **`completed`** **THEN** **Feedback** **SHALL** follow **RepositoryAdditionalDetailsCard**

