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
    output: {
      analysis: [
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
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 85,
      },
    },
    metadata: {
      product_id: "product-1",
      productId: "product-1",
      environment: "production",
      team: "security",
    }
  },
  "report-2": {
    _id: "report-2",
    input: {
      scan: {
        id: "scan-2",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1003",
            description: "Third vulnerability",
            score: 6.5,
            severity: "MEDIUM",
            published_date: "2024-01-18",
            last_modified_date: "2024-02-05",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1003",
            feed_group: "nvd",
            package: "third-package",
            package_version: "3.0.0",
            package_name: "third-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "myapp",
        tag: "v1.3.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/myapp",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1003",
          checklist: [
            {
              input: "Verify package usage",
              response: "Package is in use.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE requires attention.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Package is vulnerable.",
          },
          intel_score: 70,
          cvss: {
            score: "6.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-1",
      productId: "product-1",
      environment: "production",
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
    output: {
      analysis: [
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
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-9",
      productId: "product-9",
      environment: "staging",
    },
  },
  "report-product2-cve1001-1": {
    _id: "report-product2-cve1001-1",
    input: {
      scan: {
        id: "scan-product2-cve1001-1",
        type: "image",
        started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1001",
            description: "Sample Product B vulnerability - Critical security issue in dependency",
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
        name: "sample-product-b-repo-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-b-repo-1",
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
    output: {
      analysis: [
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
          summary: "The CVE is exploitable. Sample Product B repository 1 uses the vulnerable package version and the vulnerability has been confirmed through analysis.",
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
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 90,
      },
    },
    metadata: {
      product_id: "product-2",
      productId: "product-2",
      environment: "production",
      team: "security",
    },
  },
  "report-product2-cve1001-2": {
    _id: "report-product2-cve1001-2",
    input: {
      scan: {
        id: "scan-product2-cve1001-2",
        type: "image",
        started_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1002",
            description: "Sample Product B vulnerability - Medium security issue",
            score: 5.5,
            severity: "MEDIUM",
            published_date: "2024-01-20",
            last_modified_date: "2024-01-25",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1002",
            feed_group: "nvd",
            package: "another-package",
            package_version: "2.1.0",
            package_name: "another-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-b-repo-2",
        tag: "v1.1.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-b-repo-2",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1002",
          checklist: [
            {
              input: "Check if the vulnerability affects this version",
              response: "The vulnerability affects this version.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE requires attention.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "The package version is vulnerable.",
          },
          intel_score: 60,
          cvss: {
            score: "5.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-2",
      productId: "product-2",
      environment: "staging",
    },
  },
  "report-product3-cve1001-1": {
    _id: "report-product3-cve1001-1",
    input: {
      scan: {
        id: "scan-product3-cve1001-1",
        type: "image",
        started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1004",
            description: "Sample Product C vulnerability",
            score: 7.0,
            severity: "HIGH",
            published_date: "2024-01-22",
            last_modified_date: "2024-02-10",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1004",
            feed_group: "nvd",
            package: "product-c-package",
            package_version: "1.0.0",
            package_name: "product-c-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-c-repo-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-c-repo-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1004",
          checklist: [
            {
              input: "Verify package usage",
              response: "Package is in use.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is exploitable.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Package is vulnerable.",
          },
          intel_score: 75,
          cvss: {
            score: "7.0",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-3",
      productId: "product-3",
      environment: "production",
    },
  },
  "report-product3-cve1001-2": {
    _id: "report-product3-cve1001-2",
    input: {
      scan: {
        id: "scan-product3-cve1001-2",
        type: "image",
        started_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1005",
            description: "Sample Product C vulnerability 2",
            score: 6.0,
            severity: "MEDIUM",
            published_date: "2024-01-25",
            last_modified_date: "2024-02-15",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1005",
            feed_group: "nvd",
            package: "product-c-package-2",
            package_version: "2.0.0",
            package_name: "product-c-package-2",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-c-repo-2",
        tag: "v2.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-c-repo-2",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1005",
          checklist: [
            {
              input: "Check vulnerability",
              response: "Vulnerability confirmed.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE requires attention.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Vulnerability confirmed.",
          },
          intel_score: 65,
          cvss: {
            score: "6.0",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-3",
      productId: "product-3",
      environment: "staging",
    },
  },
  "report-product4-cve1001-1": {
    _id: "report-product4-cve1001-1",
    input: {
      scan: {
        id: "scan-product4-cve1001-1",
        type: "image",
        started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1006",
            description: "Sample Product D vulnerability",
            score: 8.0,
            severity: "HIGH",
            published_date: "2024-01-28",
            last_modified_date: "2024-02-20",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1006",
            feed_group: "nvd",
            package: "product-d-package",
            package_version: "1.0.0",
            package_name: "product-d-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-d-repo-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-d-repo-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1006",
          checklist: [
            {
              input: "Verify package usage",
              response: "Package is in use.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is exploitable.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Package is vulnerable.",
          },
          intel_score: 80,
          cvss: {
            score: "8.0",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-4",
      productId: "product-4",
      environment: "production",
    },
  },
  "report-product4-cve1001-2": {
    _id: "report-product4-cve1001-2",
    input: {
      scan: {
        id: "scan-product4-cve1001-2",
        type: "image",
        started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1007",
            description: "Sample Product D vulnerability 2",
            score: 5.0,
            severity: "MEDIUM",
            published_date: "2024-02-01",
            last_modified_date: "2024-02-25",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1007",
            feed_group: "nvd",
            package: "product-d-package-2",
            package_version: "2.0.0",
            package_name: "product-d-package-2",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-d-repo-2",
        tag: "v2.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-d-repo-2",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1007",
          checklist: [
            {
              input: "Check vulnerability",
              response: "Vulnerability confirmed.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE requires attention.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Vulnerability confirmed.",
          },
          intel_score: 50,
          cvss: {
            score: "5.0",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-4",
      productId: "product-4",
      environment: "staging",
    },
  },
  "report-product5-cve1001-1": {
    _id: "report-product5-cve1001-1",
    input: {
      scan: {
        id: "scan-product5-cve1001-1",
        type: "image",
        started_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1008",
            description: "Sample Product E vulnerability",
            score: 7.5,
            severity: "HIGH",
            published_date: "2024-02-05",
            last_modified_date: "2024-03-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1008",
            feed_group: "nvd",
            package: "product-e-package",
            package_version: "1.0.0",
            package_name: "product-e-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-e-repo-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-e-repo-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1008",
          checklist: [
            {
              input: "Verify package usage",
              response: "Package is in use.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is exploitable.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Package is vulnerable.",
          },
          intel_score: 77,
          cvss: {
            score: "7.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-5",
      productId: "product-5",
      environment: "production",
    },
  },
  "report-product5-cve1001-2": {
    _id: "report-product5-cve1001-2",
    input: {
      scan: {
        id: "scan-product5-cve1001-2",
        type: "image",
        started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1009",
            description: "Sample Product E vulnerability 2",
            score: 6.5,
            severity: "MEDIUM",
            published_date: "2024-02-10",
            last_modified_date: "2024-03-05",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1009",
            feed_group: "nvd",
            package: "product-e-package-2",
            package_version: "2.0.0",
            package_name: "product-e-package-2",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-e-repo-2",
        tag: "v2.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-e-repo-2",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1009",
          checklist: [
            {
              input: "Check vulnerability",
              response: "Vulnerability confirmed.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE requires attention.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Vulnerability confirmed.",
          },
          intel_score: 68,
          cvss: {
            score: "6.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-5",
      productId: "product-5",
      environment: "staging",
    },
  },
  "report-product6-cve1001-1": {
    _id: "report-product6-cve1001-1",
    input: {
      scan: {
        id: "scan-product6-cve1001-1",
        type: "image",
        started_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1010",
            description: "Sample Product F vulnerability",
            score: 9.0,
            severity: "CRITICAL",
            published_date: "2024-02-15",
            last_modified_date: "2024-03-10",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1010",
            feed_group: "nvd",
            package: "product-f-package",
            package_version: "1.0.0",
            package_name: "product-f-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-f-repo-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-f-repo-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1010",
          checklist: [
            {
              input: "Verify package usage",
              response: "Package is in use.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is critical and exploitable.",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "Package is vulnerable.",
          },
          intel_score: 95,
          cvss: {
            score: "9.0",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-6",
      productId: "product-6",
      environment: "production",
    },
  },
  "report-product7-cve1001-1": {
    _id: "report-product7-cve1001-1",
    input: {
      scan: {
        id: "scan-product7-cve1001-1",
        type: "image",
        started_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-1011",
            description: "Sample Product G vulnerability",
            score: 4.5,
            severity: "LOW",
            published_date: "2024-02-20",
            last_modified_date: "2024-03-15",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1011",
            feed_group: "nvd",
            package: "product-g-package",
            package_version: "1.0.0",
            package_name: "product-g-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "sample-product-g-repo-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/sample-product-g-repo-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-1011",
          checklist: [
            {
              input: "Verify package usage",
              response: "Package is in use.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE has low severity.",
          justification: {
            status: "FALSE",
            label: "not_vulnerable",
            reason: "Package is not vulnerable.",
          },
          intel_score: 20,
          cvss: {
            score: "4.5",
            vector_string: "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-7",
      productId: "product-7",
      environment: "production",
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
    output: {
      analysis: [
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
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 90,
      },
    },
    metadata: {
      product_id: "product-8",
      productId: "product-8",
      environment: "production",
      team: "security",
    },
  },
  // All Colors Demo Product - Representative reports for each state
  "report-all-colors-completed-1": {
    _id: "report-all-colors-completed-1",
    input: {
      scan: {
        id: "scan-all-colors-completed-1",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(), // completed state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product",
            score: 9.8,
            severity: "CRITICAL",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-vulnerable-package",
            package_version: "1.0.0",
            package_name: "demo-vulnerable-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-vulnerable-package",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          checklist: [
            {
              input: "Verify if the vulnerable package is being used",
              response: "The package is confirmed to be in use based on dependency analysis.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is not exploitable. This is a demo report showing not vulnerable status (green).",
          justification: {
            status: "FALSE",
            label: "not_vulnerable",
            reason: "The package version in use has been patched and is not vulnerable to this CVE.",
          },
          intel_score: 85,
          cvss: {
            score: "9.8",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 85,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-2": {
    _id: "report-all-colors-completed-2",
    input: {
      scan: {
        id: "scan-all-colors-completed-2",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "", // queued state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability - Medium severity",
            score: 4.5,
            severity: "MEDIUM",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-medium-package",
            package_version: "1.0.0",
            package_name: "demo-medium-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-2",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-2",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-medium-package",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [], // queued - no analysis yet
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 60,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-3": {
    _id: "report-all-colors-completed-3",
    input: {
      scan: {
        id: "scan-all-colors-completed-3",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "", // sent state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability - High severity",
            score: 7.0,
            severity: "HIGH",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-high-package",
            package_version: "1.0.0",
            package_name: "demo-high-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-3",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-3",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-high-package",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [], // sent - no analysis yet
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 75,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-4": {
    _id: "report-all-colors-completed-4",
    input: {
      scan: {
        id: "scan-all-colors-completed-4",
        type: "image",
        started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        completed_at: "", // expired state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability - Low severity",
            score: 2.1,
            severity: "LOW",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-low-package",
            package_version: "1.0.0",
            package_name: "demo-low-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-4",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-4",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-low-package",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "2.1",
            vector_string: "CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 30,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-safe-1": {
    _id: "report-all-colors-completed-safe-1",
    input: {
      scan: {
        id: "scan-all-colors-completed-safe-1",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "", // queued state - not completed yet
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product",
            score: 3.2,
            severity: "LOW",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-safe-package",
            package_version: "2.0.0",
            package_name: "demo-safe-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-safe-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-safe-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-safe-package",
              version: "2.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          checklist: [
            {
              input: "Check if the vulnerability affects this version",
              response: "The vulnerability does not affect this version of the package.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is not exploitable. This is a demo report showing not vulnerable status (green).",
          justification: {
            status: "FALSE",
            label: "not_vulnerable",
            reason: "The package version in use has been patched and is not vulnerable to this CVE.",
          },
          intel_score: 10,
          cvss: {
            score: "3.2",
            vector_string: "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 10,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-safe-2": {
    _id: "report-all-colors-completed-safe-2",
    input: {
      scan: {
        id: "scan-all-colors-completed-safe-2",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product (not vulnerable)",
            score: 5.5,
            severity: "MEDIUM",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-safe-package-2",
            package_version: "3.1.0",
            package_name: "demo-safe-package-2",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-safe-2",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-safe-2",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-safe-package-2",
              version: "3.1.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          checklist: [
            {
              input: "Check if the vulnerability affects this version",
              response: "The vulnerability does not affect this version of the package. The package has been updated to a patched version.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is not exploitable. This is a demo report showing not vulnerable status (green) with medium CVSS score.",
          justification: {
            status: "FALSE",
            label: "not_vulnerable",
            reason: "The package version in use has been patched and is not vulnerable to this CVE.",
          },
          intel_score: 15,
          cvss: {
            score: "5.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 15,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-safe-3": {
    _id: "report-all-colors-completed-safe-3",
    input: {
      scan: {
        id: "scan-all-colors-completed-safe-3",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product (not vulnerable)",
            score: 7.8,
            severity: "HIGH",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-safe-package-3",
            package_version: "4.2.0",
            package_name: "demo-safe-package-3",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-safe-3",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-safe-3",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-safe-package-3",
              version: "4.2.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          checklist: [
            {
              input: "Check if the vulnerability affects this version",
              response: "The vulnerability does not affect this version of the package. The package has been updated to a patched version that addresses this CVE.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is not exploitable. This is a demo report showing not vulnerable status (green) with high CVSS score.",
          justification: {
            status: "FALSE",
            label: "not_vulnerable",
            reason: "The package version in use has been patched and is not vulnerable to this CVE, despite the high CVSS score.",
          },
          intel_score: 20,
          cvss: {
            score: "7.8",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 20,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-unknown-1": {
    _id: "report-all-colors-completed-unknown-1",
    input: {
      scan: {
        id: "scan-all-colors-completed-unknown-1",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "", // queued state - not completed yet
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product",
            score: 8.5,
            severity: "HIGH",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-unknown-package",
            package_version: "1.5.0",
            package_name: "demo-unknown-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-unknown-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-unknown-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-unknown-package",
              version: "1.5.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          checklist: [
            {
              input: "Assess the vulnerability status",
              response: "Unable to determine with certainty whether the vulnerability affects this version.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE status is uncertain. This is a demo report showing uncertain status (gray).",
          justification: {
            status: "UNKNOWN",
            label: "uncertain",
            reason: "Insufficient information to determine vulnerability status.",
          },
          intel_score: 50,
          cvss: {
            score: "8.5",
            vector_string: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 50,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-5": {
    _id: "report-all-colors-completed-5",
    input: {
      scan: {
        id: "scan-all-colors-completed-5",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "", // failed state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product",
            score: 6.2,
            severity: "MEDIUM",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-vulnerable-package-5",
            package_version: "1.0.0",
            package_name: "demo-vulnerable-package-5",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-5",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-5",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-vulnerable-package-5",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "6.2",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:L",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 55,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-6": {
    _id: "report-all-colors-completed-6",
    input: {
      scan: {
        id: "scan-all-colors-completed-6",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "", // pending state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product",
            score: 8.1,
            severity: "HIGH",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-vulnerable-package-6",
            package_version: "1.0.0",
            package_name: "demo-vulnerable-package-6",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-6",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-6",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-vulnerable-package-6",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "8.1",
            vector_string: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 80,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-7": {
    _id: "report-all-colors-completed-7",
    input: {
      scan: {
        id: "scan-all-colors-completed-7",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(), // completed state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product",
            score: 5.8,
            severity: "MEDIUM",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-vulnerable-package-7",
            package_version: "1.0.0",
            package_name: "demo-vulnerable-package-7",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-7",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-7",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-vulnerable-package-7",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          checklist: [
            {
              input: "Verify if the vulnerable package is being used",
              response: "The package is confirmed to be in use.",
              intermediate_steps: null,
            },
          ],
          summary: "The CVE is exploitable with medium severity. CVSS score: 5.8",
          justification: {
            status: "TRUE",
            label: "vulnerable",
            reason: "The analysis confirms that the vulnerable package is in use.",
          },
          intel_score: 58,
          cvss: {
            score: "5.8",
            vector_string: "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:C/C:L/I:L/A:L",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 58,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-completed-8": {
    _id: "report-all-colors-completed-8",
    input: {
      scan: {
        id: "scan-all-colors-completed-8",
        type: "image",
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "", // queued state
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product",
            score: 9.5,
            severity: "CRITICAL",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-vulnerable-package-8",
            package_version: "1.0.0",
            package_name: "demo-vulnerable-package-8",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-completed-vuln-8",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-completed-vuln-8",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
        sbom_info: {
          packages: [
            {
              name: "demo-vulnerable-package-8",
              version: "1.0.0",
            },
          ],
        },
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "9.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          },
        },
      ],
      vex: null,
    },
    info: {
      vdb: {
        version: "2024.1",
      },
      intel: {
        score: 95,
      },
    },
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-expired-1": {
    _id: "report-all-colors-expired-1",
    input: {
      scan: {
        id: "scan-all-colors-expired-1",
        type: "image",
        started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "",
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product - Expired state",
            score: 9.1,
            severity: "CRITICAL",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-package",
            package_version: "1.0.0",
            package_name: "demo-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-expired-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-expired-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "9.1",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-failed-1": {
    _id: "report-all-colors-failed-1",
    input: {
      scan: {
        id: "scan-all-colors-failed-1",
        type: "image",
        started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "",
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product - Failed state",
            score: 5.5,
            severity: "MEDIUM",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-package",
            package_version: "1.0.0",
            package_name: "demo-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-failed-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-failed-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "5.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:L",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-queued-1": {
    _id: "report-all-colors-queued-1",
    input: {
      scan: {
        id: "scan-all-colors-queued-1",
        type: "image",
        started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "",
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product - Queued state",
            score: 7.5,
            severity: "HIGH",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-package",
            package_version: "1.0.0",
            package_name: "demo-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-queued-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-queued-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "7.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-sent-1": {
    _id: "report-all-colors-sent-1",
    input: {
      scan: {
        id: "scan-all-colors-sent-1",
        type: "image",
        started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: "",
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product - Sent state",
            score: 4.0,
            severity: "MEDIUM",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-package",
            package_version: "1.0.0",
            package_name: "demo-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-sent-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-sent-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "4.0",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
  "report-all-colors-pending-1": {
    _id: "report-all-colors-pending-1",
    input: {
      scan: {
        id: "scan-all-colors-pending-1",
        type: "image",
        started_at: new Date().toISOString(),
        completed_at: "",
        vulns: [
          {
            vuln_id: "CVE-2024-DEMO",
            description: "Demo vulnerability for All Colors product - Pending state",
            score: 2.5,
            severity: "LOW",
            published_date: "2024-01-15",
            last_modified_date: "2024-02-01",
            url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-DEMO",
            feed_group: "nvd",
            package: "demo-package",
            package_version: "1.0.0",
            package_name: "demo-package",
            package_type: "npm",
          },
        ],
      },
      image: {
        analysis_type: "image",
        ecosystem: "nodejs",
        name: "demo-pending-1",
        tag: "v1.0.0",
        source_info: [
          {
            type: "git",
            git_repo: "https://github.com/example/demo-pending-1",
            ref: "main",
            include: ["**/*.js", "package.json"],
            exclude: ["node_modules/**"],
          },
        ],
      },
    },
    output: {
      analysis: [
        {
          vuln_id: "CVE-2024-DEMO",
          cvss: {
            score: "2.5",
            vector_string: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N",
          },
        },
      ],
      vex: null,
    },
    info: {},
    metadata: {
      product_id: "product-all-colors",
      productId: "product-all-colors",
      environment: "production",
      team: "demo",
    },
  },
};

