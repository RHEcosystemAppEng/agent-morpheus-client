/**
 * Mock FullReport data for MSW
 * 
 * These are detailed report structures that match the FullReport TypeScript type.
 * Used for mocking the GET /api/reports/:id endpoint.
 */

import type { FullReport } from "../types/FullReport";

export const mockFullReports: Record<string, FullReport> = {
  "report-1": {
    _id: "report-1",
    input: {
      scan: {
        id: "scan-1",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1001",
            description: "Sample vulnerability description",
            score: 7.5,
            severity: "HIGH",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1001",
            feed_group: "nvd",
            package: "example-package",
            package_version: "1.0.0",
            package_name: "example-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "myapp",
        tag: "v1.2.3",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/myapp",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "example-package",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: [
      {
        vuln_id: "CVE-2024-1001",
        checklist: [
          {
            input: "Verify if the vulnerable package is being used",
            response: "The package is confirmed to be in use based on dependency analysis.",
            intermediate_steps: null,
          },
          {
            input: "Assess the impact of the vulnerability",
            response: "The vulnerability has a high severity score and could lead to remote code execution.",
            intermediate_steps: null,
          },
        ],
        summary: "The CVE is exploitable. The application uses the vulnerable package version and the vulnerability has been confirmed through analysis.",
        justification: {
          status: "TRUE",
          label: "vulnerable",
          reason: "The analysis confirms that the vulnerable package is in use and the vulnerability is exploitable in this context.",
        },
        intel_score: 85,
        cvss: {
          score: "8.7",
          vector_string: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:N",
        },
      },
    ],
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 85,
      },
    },
    metadata: {
      productId: "product-1",
      environment: "production",
      team: "security",
    },
  },
  "report-3": {
    _id: "report-3",
    input: {
      scan: {
        id: "scan-3",
        type: "image",
        started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1002",
            description: "Another vulnerability",
            score: 5.0,
            severity: "MEDIUM",
            published_date: "2024-01-20",
            last_modified_date: "2024-01-25",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1002",
            feed_group: "nvd",
            package: "another-package",
            package_version: "2.0.0",
            package_name: "another-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        name: "api-server",
        tag: "v2.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/api-server",
            ref: "v2.0.0",
            include: ["**/*.ts", "package.json"],
            exclude: ["node_modules/**", "dist/**"],
          },
        ],
      },
    },
    output: [
      {
        vuln_id: "CVE-2024-1002",
        checklist: [
          {
            input: "Check if the vulnerability affects this version",
            response: "The vulnerability does not affect this version of the package.",
            intermediate_steps: null,
          },
        ],
        summary: "The CVE is not exploitable. The application uses a patched version that is not affected by this vulnerability.",
        justification: {
          status: "FALSE",
          label: "not_vulnerable",
          reason: "The package version in use has been patched and is not vulnerable to this CVE.",
        },
        intel_score: 10,
        cvss: {
          score: "5.0",
          vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
        },
      },
    ],
    info: {},
    metadata: {
      productId: "product-1",
      environment: "staging",
    },
  },
  "report-product1-cve1001-1": {
    _id: "report-product1-cve1001-1",
    input: {
      scan: {
        id: "scan-product1-cve1001-1",
        type: "image",
        started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1001",
            description: "Sample Product A vulnerability - Critical security issue in dependency",
            score: 8.5,
            severity: "HIGH",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1001",
            feed_group: "nvd",
            package: "vulnerable-package",
            package_version: "1.2.3",
            package_name: "vulnerable-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-a-repo-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-a-repo-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "vulnerable-package",
              version: "1.2.3",
            },
          ],
        },
      },
    },
    output: [
      {
        vuln_id: "CVE-2024-1001",
        checklist: [
          {
            input: "Verify if the vulnerable package is being used",
            response: "The package vulnerable-package version 1.2.3 is confirmed to be in use in this repository.",
            intermediate_steps: null,
          },
          {
            input: "Assess the impact of the vulnerability",
            response: "The vulnerability has a high severity score (8.5) and could lead to remote code execution in the production environment.",
            intermediate_steps: null,
          },
        ],
        summary: "The CVE is exploitable. Sample Product A repository 1 uses the vulnerable package version and the vulnerability has been confirmed through analysis.",
        justification: {
          status: "TRUE",
          label: "vulnerable",
          reason: "The analysis confirms that the vulnerable package is in use and the vulnerability is exploitable in this context. Immediate action is required.",
        },
        intel_score: 90,
        cvss: {
          score: "8.5",
          vector_string: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:N",
        },
      },
    ],
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 90,
      },
    },
    metadata: {
      productId: "product-1",
      environment: "production",
      team: "security",
    },
  },
};

