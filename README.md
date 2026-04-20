# Red Hat Exploit Intelligence- client

This project is a Quarkus + React web application implemented to interact with ExploitIQ service
for sending requests to evaluate vulnerabilities on specific SBOMs.

For product documentation and deeper context, see the [Exploit Intelligence documentation](https://github.com/RHEcosystemAppEng/exploitiq-docs).


## Development

Check this other documents for:

* [Configuration](./docs/configuration.md)
* [Development](./docs/development.md)


## Using the Application

Open http://localhost:8080/

### Home Page

On the Home page, you will find a central dashboard designed to manage your exploitability analysis workflow and monitor recent system performance.

**Get Started with ExploitIQ**

In this section, you will find quick-access links to the core functions of the application: Request Analysis, View Reports, and Learn More.

**Last Week Metrics**

In this section, you will find a summary of system performance from the past seven days.

![home_page](./docs/images/home_page.png)

### Request Analysis

The _Request Analysis_ dialog lets you choose an input type with **SBOM** or **Single Repository**, then enter a CVE ID to analyze.

- **SBOM:** Upload a JSON SBOM file. Supported formats: **SPDX 2.3** and **CycloneDX 1.6** JSON.
- **Single Repository:** Provide a source repository URL and a commit ID instead of an SBOM file.

For private repositories, enable **Private repository** and enter an **Authentication secret** (SSH private key or Personal Access Token; the form auto-detects the type).

 The `user name` will be automatically added as a metadata parameter.

![request_analysis](./docs/images/request_analysis.png)

Once you have filled in the required fields for your chosen mode (SBOM file or repository and commit) and the CVE ID, you will be able to submit the request


After submitting the request, you will be redirected to the Report page. Once the analysis is complete, you will find a detailed report featuring the Agent's results for your request along with additional data insights.

![report](./docs/images/report.png)

- **Direct Links:** You will find that the _Repository Name_ links directly to the git repository, while the _Commit ID_ links to the specific commit used in the analysis.


**Note:** There is a configurable pool of concurrent requests. Any request that is submitted when the pool is full will be queued. If after a certain time a callback response is not received, the report will be _expired_ (failed).

### CVE Details Page

By clicking on the CVE link:

![cve_click.png](./docs/images/cve_click.png)

you will navigate to the CVE Details page where you can find details about a specific CVE.

![cve_details_page.png](./docs/images/cve_details_page.png)

### Reports Page

The Reports area is split into two tabs: **SBOMs** and **Single Repositories**. Use the tab that matches how the analysis was submitted to browse, sort, filter, and open results for each report type.

**Report Organization:** Each row represents a report for that tab’s context (SBOM-based products or single-repository analyses), which may reflect one component or many depending on the original request.

You will be able to sort, filter, and organize the reports table to quickly locate specific data.

![reports_page](./docs/images/reports_page.png)
![reports_page_single](./docs/images/reports_page_single.png)

After clicking a _ID_ link, you will find one of two views depending on the request type:

- **Single Component:** You will be taken directly to the detailed report page as described above.

- **Multiple Components:** You will be directed to an SBOM overview page that provides a high-level summary of results across all components.

### Report Page

![report_page](./docs/images/report_page.png)

On this page, you will find:

- **Report Details:** You will see general information about the report, including _overview statuses_ such as Repository Analysis Distribution and a CVE Status Summary, which provide high-level data on the SBOM and its associated CVEs.
 When there are excluded components, the **Excluded components** field links to a dedicated page that lists component name, package URL, and error for each item that was left out of analysis.

- **Component Table:** Below the summary data, you will find a table listing all components included in the SBOM:

![repository_table](./docs/images/repository_table.png)

You will be able to sort, filter, and organize the reports to quickly locate specific data.

- **ID link:** Finally, By clicking the _ID_ link, you will be taken to the detailed report page for that specific repository, the same page you would access directly for a single-component SBOM.

### Report

![report](./docs/images/report.png)

### Download Feature

A blue **Download** button is available on the repository report page, providing access to download either the VEX (Vulnerability Exploitability eXchange) data or the complete report as JSON files. The VEX option is only available when the component is in a vulnerable status and is automatically disabled otherwise.

![download_button](./docs/images/download_button.png)

![download_open](./docs/images/download_open.png)

## Analysis pipeline diagram

The flowchart below is a high-level map of what happens after you submit an analysis request. It is meant for operators, integrators, and anyone tracing why a report ended up **queued**, **sent**, **failed**, **excluded**, or in a given **finding** state.


The diagram is rendered here for GitHub readers. To iterate on layout or wording, edit [docs/analysis-pipeline-workflow.mmd](./docs/analysis-pipeline-workflow.mmd) and paste the updated `flowchart` (and `%%{init: ...}%%` line if present) into the block below.

```mermaid
%%{init: {"htmlLabels": true}}%%

flowchart TB
    classDef error fill:#fecaca,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef timeout fill:#fde68a,stroke:#b45309,stroke-width:2px,color:#78350f
    classDef terminal fill:#e5e7eb,stroke:#374151,stroke-width:2px,color:#111827
    classDef progress fill:#dbeafe,stroke:#1d4ed8,stroke-width:2px,color:#1e3a8a
    classDef ok fill:#bbf7d0,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef caption fill:#f8fafc,stroke:#94a3b8,stroke-width:1px,color:#334155

    HEADER["<b>Exploit Intelligence -<br/>Analysis Pipeline</b>"]
    class HEADER caption

    START([User request analysis])

    SPLIT([Which flow? <br/>CVE ID +  SPDX SBOM = Product <br/>CVE ID + Repository URL & Commit ID / CycloneDX SBOM = Single component<br/>])

    subgraph PRODUCT["<b>Path A — Product (multi-component)</b>"]
        direction TB
        P_PARSE[Parse product -parsing level]
        P_PARSE_ERR[[No preprocessing, no agent.<br/>analysis state: error]]
        P_OK[Parse OK → create product<br/>user navigates to product page]

        subgraph PER_COMP[" "]
            direction TB
            PER_CAPTION["For each component in array — async, parallel.<br/>Each component supplies an image only."]
            SYFT[Syft → CycloneDX]
            SYFT_FAIL[[goes to excluded components]]
            EXHORT[Exhort — dependency analytics]
            EXHORT_ERR[[Exhort failed <br/>---]]
            VULN_CHECK[Vulnerable package<br/>present in codebase?]
            TO_AGENT[Send to agent — AI analysis]
            NO_VULN_EXCL[[Vulnerable package not in codebase.<br/>goes to excluded components]]

            PER_CAPTION --> SYFT
        end

        P_PARSE -->|success| P_OK
        P_PARSE -->|failed| P_PARSE_ERR
        P_OK --> PER_CAPTION
        SYFT -->|success| EXHORT
        SYFT -->|failed| SYFT_FAIL
        EXHORT -->|success| VULN_CHECK
        EXHORT -->|failed| EXHORT_ERR
        VULN_CHECK -->|success| TO_AGENT
        VULN_CHECK -->|failed| NO_VULN_EXCL
    end

    subgraph SINGLE["<b>Path B — Single component</b><br/>(repository / CycloneDX)"]
        direction TB
        SC_START[<br/>Single-component intake<br/>skips product parsing, Syft, Exhort per-component branch]
    end

    subgraph AGENT["<b>Shared — Agent pipeline</b><br/>(product component OR single component)"]
        direction TB
        A_Q[Queue<br/>Finding: in progress]
        A_PENDING_MAX[State: Pending max active]
        A_Q_OVERFLOW[[Queue overflow<br/>Finding: Failed]]
        A_SENT[Sent to agent<br/>State: sent<br/>Finding: in progress]
        A_CLONE_FAIL[[Clone failed<br/>State- excluded<br/>Finding: Failed]]
        A_T1[[Timeout<br/>State: expired<br/>Finding: Failed]]
        A_ANAL[Agent analysis<br/>Finding: in progress<br/> many internal steps...]
        A_STEP_FAIL[[Any analysis step failed<br/>State: completed<br/>Finding: Uncertain]]
        A_T2[[Timeout<br/>State: expired<br/>Finding: Failed]]
        A_DONE[Completed<br/>State:completed]
        A_RESULT{Vulnerability conclusion}
        A_VULN([Finding: Vulnerable])
        A_SAFE([Finding: Not vulnerable])
        A_UNCERT([Finding: Uncertain])
    end

    HEADER --> START
    START --> SPLIT
    SPLIT -->|product| P_PARSE
    SPLIT -->|single component| SC_START

    SC_START --> A_Q
    TO_AGENT --> A_Q

    A_Q -->|direct| A_SENT
    A_Q -->|pending max active| A_PENDING_MAX
    A_Q -->|queue overflow| A_Q_OVERFLOW
    A_PENDING_MAX --> A_SENT
    A_SENT -->|success| A_ANAL
    A_SENT -->|clone failed| A_CLONE_FAIL
    A_SENT -->|timeout| A_T1
    A_ANAL -->|all steps OK| A_DONE
    A_ANAL -->|timeout| A_T2
    A_ANAL -->|step failure| A_STEP_FAIL
    A_DONE --> A_RESULT
    A_RESULT --> A_VULN & A_SAFE & A_UNCERT

    class P_PARSE_ERR,SYFT_FAIL,EXHORT_ERR,NO_VULN_EXCL,A_CLONE_FAIL,A_STEP_FAIL,A_Q_OVERFLOW error
    class A_T1,A_T2 timeout
    class A_VULN,A_SAFE,A_UNCERT terminal
    class A_Q,A_SENT,A_ANAL,A_RESULT progress
    class P_OK,A_DONE,TO_AGENT ok
    class PER_CAPTION caption
```
