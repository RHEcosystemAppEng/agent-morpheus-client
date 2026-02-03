/**
 * MSW (Mock Service Worker) handlers for API mocking
 *
 * These handlers intercept HTTP requests and return mock data.
 * This allows development and testing without a backend server.
 *
 * To enable mocks, set VITE_ENABLE_MSW=true in your environment.
 */

import { http, HttpResponse } from "msw";
import type {
  ReportsSummary,
  Report,
  VulnResult,
  SbomReport,
} from "../generated-client";
import { mockFullReports } from "./mockFullReports";

// Mock data generators with varied scenarios
const generateMockProduct = (
  productId: string,
  sbomName: string,
  cveId: string,
  options?: {
    state?: "completed" | "pending" | "analyzing";
    numReports?: number;
    completedCount?: number;
    failedCount?: number;
    pendingCount?: number;
    hasVulnerabilities?: boolean;
  }
): SbomReport => {
  const now = new Date().toISOString();

  const state = options?.state || "completed";
  const numReports = options?.numReports ?? 10;
  const completedCount =
    options?.completedCount ?? Math.floor(numReports * 0.8);
  const failedCount = options?.failedCount ?? Math.floor(numReports * 0.1);
  const pendingCount =
    options?.pendingCount ?? numReports - completedCount - failedCount;
  const hasVulnerabilities = options?.hasVulnerabilities ?? true;

  // Generate CVE status counts
  const cveStatusCounts: Record<string, number> = {};
  if (hasVulnerabilities) {
    cveStatusCounts.TRUE = Math.floor(completedCount * 0.4);
    cveStatusCounts.FALSE = Math.floor(completedCount * 0.3);
    cveStatusCounts.UNKNOWN = Math.floor(completedCount * 0.2);
  } else {
    cveStatusCounts.FALSE = completedCount;
  }

  // Generate status counts
  const statusCounts: Record<string, number> = {
    completed: completedCount,
    failed: failedCount,
    pending: pendingCount,
  };

  // Generate submittedAt timestamp (2 days ago for variety)
  const submittedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  return {
    sbomReportId: productId,
    sbomName,
    cveId,
    cveStatusCounts,
    statusCounts,
    completedAt: state === "completed" ? now : undefined,
    submittedAt,
    numReports,
    firstReportId: `report-${productId}-${cveId}-1`,
  };
};

const generateMockReport = (
  id: string,
  productId: string,
  options?: {
    state?: "completed" | "pending" | "queued" | "sent" | "failed";
    hasVulnerabilities?: boolean;
    vulnCount?: number;
    imageName?: string;
    imageTag?: string;
  }
): Report => {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(
    Date.now() - 2 * 24 * 60 * 60 * 1000
  ).toISOString();

  const state = options?.state || "completed";
  const hasVulnerabilities = options?.hasVulnerabilities ?? true;
  const vulnCount = options?.vulnCount ?? 2;

  // Generate vulnerabilities based on state
  const vulns: VulnResult[] = [];
  if (state === "completed") {
    for (let i = 1; i <= vulnCount; i++) {
      const isVulnerable = hasVulnerabilities && i === 1;
      vulns.push({
        vulnId: `CVE-2024-${1000 + i}`,
        justification: {
          status: isVulnerable ? "TRUE" : "FALSE",
          label: isVulnerable ? "vulnerable" : "not_vulnerable",
        },
      });
    }
  }

  return {
    id,
    name: `Report ${id}`,
    startedAt: state === "completed" ? twoDaysAgo : yesterday,
    completedAt: state === "completed" ? now : "",
    imageName: options?.imageName || `sample-image-${id}`,
    imageTag: options?.imageTag || "latest",
    state,
    vulns,
    metadata: {
      productId,
      environment: "production",
    },
    gitRepo: "https://github.com/example/repo",
    ref: "main",
  };
};

// Mock data storage (simulates a simple in-memory database)
// Create diverse products with different states and repository counts
// Note: Products are grouped by sbomReportId and cveId, so we create one SbomReport per CVE
const mockProducts: SbomReport[] = [
  // Product 1: Completed with vulnerabilities, 25 repositories, 3 CVEs
  generateMockProduct("product-1", "Sample Product A", "CVE-2024-1001", {
    state: "completed",
    numReports: 25,
    completedCount: 22,
    failedCount: 2,
    pendingCount: 1,
    hasVulnerabilities: true,
  }),
  generateMockProduct("product-1", "Sample Product A", "CVE-2024-1002", {
    state: "completed",
    numReports: 25,
    completedCount: 22,
    failedCount: 2,
    pendingCount: 1,
    hasVulnerabilities: false,
  }),
  generateMockProduct("product-1", "Sample Product A", "CVE-2024-1003", {
    state: "completed",
    numReports: 25,
    completedCount: 22,
    failedCount: 2,
    pendingCount: 1,
    hasVulnerabilities: false,
  }),

  // Product 2: Still analyzing, 50 repositories, 2 CVEs
  generateMockProduct("product-2", "Sample Product B", "CVE-2024-1004", {
    state: "analyzing",
    numReports: 50,
    completedCount: 35,
    failedCount: 3,
    pendingCount: 12,
    hasVulnerabilities: true,
  }),
  generateMockProduct("product-2", "Sample Product B", "CVE-2024-1005", {
    state: "analyzing",
    numReports: 50,
    completedCount: 35,
    failedCount: 3,
    pendingCount: 12,
    hasVulnerabilities: false,
  }),

  // Product 3: Completed with NOT VULNERABLE + UNCERTAIN (no vulnerable repos), 15 repositories
  {
    sbomReportId: "product-3",
    sbomName: "Sample Product C",
    cveId: "CVE-2024-1003",
    cveStatusCounts: {
      FALSE: 10, // 10 repos not vulnerable
      UNKNOWN: 5, // 5 repos uncertain
    },
    statusCounts: {
      completed: 15,
      failed: 0,
      pending: 0,
    },
    completedAt: new Date().toISOString(),
    numReports: 15,
    firstReportId: "report-product-3-cve1003-1",
  },
  {
    sbomReportId: "product-3",
    sbomName: "Sample Product C",
    cveId: "CVE-2024-1004",
    cveStatusCounts: {
      FALSE: 8, // 8 repos not vulnerable
      UNKNOWN: 7, // 7 repos uncertain
    },
    statusCounts: {
      completed: 15,
      failed: 0,
      pending: 0,
    },
    completedAt: new Date().toISOString(),
    numReports: 15,
    firstReportId: "report-product-3-cve1004-1",
  },

  // Product 4: Pending analysis, 8 repositories
  generateMockProduct("product-4", "Sample Product D", "CVE-2024-1006", {
    state: "pending",
    numReports: 8,
    completedCount: 0,
    failedCount: 0,
    pendingCount: 8,
    hasVulnerabilities: false,
  }),

  // Product 5: Completed with many repositories, 100 repositories, 5 CVEs
  generateMockProduct("product-5", "Sample Product E", "CVE-2024-1007", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: true,
  }),
  generateMockProduct("product-5", "Sample Product E", "CVE-2024-1008", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),
  generateMockProduct("product-5", "Sample Product E", "CVE-2024-1009", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),
  generateMockProduct("product-5", "Sample Product E", "CVE-2024-1010", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),
  generateMockProduct("product-5", "Sample Product E", "CVE-2024-1011", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),

  // Product 6: Analyzing with medium repository count, 30 repositories, 4 CVEs
  generateMockProduct("product-6", "Sample Product F", "CVE-2024-1012", {
    state: "analyzing",
    numReports: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: true,
  }),
  generateMockProduct("product-6", "Sample Product F", "CVE-2024-1013", {
    state: "analyzing",
    numReports: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: false,
  }),
  generateMockProduct("product-6", "Sample Product F", "CVE-2024-1014", {
    state: "analyzing",
    numReports: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: false,
  }),
  generateMockProduct("product-6", "Sample Product F", "CVE-2024-1015", {
    state: "analyzing",
    numReports: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: false,
  }),
];

const mockReports: Report[] = [
  // Report 1: Completed with vulnerabilities
  generateMockReport("report-1", "product-1", {
    state: "completed",
    hasVulnerabilities: true,
    vulnCount: 3,
    imageName: "myapp",
    imageTag: "v1.2.3",
  }),

  // Report 2: Still analyzing (sent to ExploitIQ)
  generateMockReport("report-2", "product-2", {
    state: "sent",
    hasVulnerabilities: false,
    vulnCount: 0,
    imageName: "webapp",
    imageTag: "latest",
  }),

  // Report 3: Completed without vulnerabilities
  generateMockReport("report-3", "product-1", {
    state: "completed",
    hasVulnerabilities: false,
    vulnCount: 1,
    imageName: "api-server",
    imageTag: "v2.0.0",
  }),

  // Report 4: Queued (waiting to be sent)
  generateMockReport("report-4", "product-3", {
    state: "queued",
    hasVulnerabilities: false,
    vulnCount: 0,
    imageName: "database",
    imageTag: "stable",
  }),

  // Report 5: Pending (just created)
  generateMockReport("report-5", "product-4", {
    state: "pending",
    hasVulnerabilities: false,
    vulnCount: 0,
    imageName: "cache-service",
    imageTag: "dev",
  }),

  // Report 6: Completed with many vulnerabilities
  generateMockReport("report-6", "product-5", {
    state: "completed",
    hasVulnerabilities: true,
    vulnCount: 5,
    imageName: "legacy-app",
    imageTag: "v0.9.0",
  }),

  // Report 7: Failed analysis
  generateMockReport("report-7", "product-6", {
    state: "failed",
    hasVulnerabilities: false,
    vulnCount: 0,
    imageName: "broken-image",
    imageTag: "test",
  }),

  // Report 8: Still analyzing (sent state)
  generateMockReport("report-8", "product-2", {
    state: "sent",
    hasVulnerabilities: false,
    vulnCount: 0,
    imageName: "microservice",
    imageTag: "v3.1.0",
  }),

  // Report 9: Completed with uncertain status (UNKNOWN)
  {
    id: "report-9",
    name: "Report report-9",
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date().toISOString(),
    imageName: "uncertain-app",
    imageTag: "v1.5.0",
    state: "completed",
    vulns: [
      {
        vulnId: "CVE-2024-2001",
        justification: {
          status: "UNKNOWN",
          label: "uncertain",
        },
      },
      {
        vulnId: "CVE-2024-2002",
        justification: {
          status: "UNKNOWN",
          label: "uncertain",
        },
      },
    ],
    metadata: {
      productId: "product-1",
      environment: "production",
    },
    gitRepo: "https://github.com/example/uncertain-repo",
    ref: "main",
  },

  // Report 10: Sample Product A / CVE-2024-1001 - First report for pagination testing
  {
    id: "report-product1-cve1001-1",
    name: "Report report-product1-cve1001-1",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    imageName: "sample-product-a-repo-1",
    imageTag: "v1.0.0",
    state: "completed",
    vulns: [
      {
        vulnId: "CVE-2024-1001",
        justification: {
          status: "TRUE",
          label: "vulnerable",
        },
      },
    ],
    metadata: {
      productId: "product-1",
      environment: "production",
    },
    gitRepo: "https://github.com/example/sample-product-a-repo-1",
    ref: "main",
  },

  // Generate 30+ additional reports for Sample Product A / CVE-2024-1001 for pagination testing
  ...Array.from({ length: 30 }, (_, i) => {
    const reportNum = i + 2;
    const daysAgo = 3 + Math.floor(i / 10);
    const isVulnerable = i % 3 === 0; // Mix of vulnerable, not vulnerable, and uncertain
    const status = isVulnerable ? "TRUE" : i % 3 === 1 ? "FALSE" : "UNKNOWN";
    const label = isVulnerable ? "vulnerable" : i % 3 === 1 ? "not_vulnerable" : "uncertain";
    
    return {
      id: `report-product1-cve1001-${reportNum}`,
      name: `Report report-product1-cve1001-${reportNum}`,
      startedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString(),
      imageName: `sample-product-a-repo-${reportNum}`,
      imageTag: `v1.${reportNum}.0`,
      state: "completed" as const,
      vulns: [
        {
          vulnId: "CVE-2024-1001",
          justification: {
            status,
            label,
          },
        },
      ],
      metadata: {
        productId: "product-1",
        environment: "production",
      },
      gitRepo: `https://github.com/example/sample-product-a-repo-${reportNum}`,
      ref: `branch-${reportNum}`,
    };
  }),
];

// Generate reports summary based on actual mock data
const generateMockReportsSummary = (): ReportsSummary => {
  // Calculate summary from actual mock reports
  const completedReports = mockReports.filter((r) => r.state === "completed");
  const vulnerableReports = completedReports.filter((r) =>
    r.vulns?.some((v) => v.justification?.status === "TRUE")
  );
  const nonVulnerableReports = completedReports.filter(
    (r) => !r.vulns?.some((v) => v.justification?.status === "TRUE")
  );
  const pendingReports = mockReports.filter(
    (r) => r.state === "pending" || r.state === "queued" || r.state === "sent"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newReportsToday = completedReports.filter((r) => {
    if (!r.completedAt) return false;
    const completedDate = new Date(r.completedAt);
    return completedDate >= today;
  });

  return {
    vulnerableReportsCount: vulnerableReports.length,
    nonVulnerableReportsCount: nonVulnerableReports.length,
    pendingRequestsCount: pendingReports.length,
    newReportsTodayCount: newReportsToday.length,
  };
};

/**
 * MSW request handlers
 * Each handler intercepts a specific API endpoint and returns mock data
 */
export const handlers = [
  // GET /api/v1/sbom-reports - List all SBOM reports
  http.get("/api/v1/sbom-reports", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "100", 10);
    const sortField = url.searchParams.get("sortField") || "submittedAt";
    const sortDirection = url.searchParams.get("sortDirection") || "DESC";

    // Apply sorting
    let sortedProducts = [...mockProducts];
    if (sortField === "submittedAt") {
      sortedProducts.sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return sortDirection === "ASC" ? aTime - bTime : bTime - aTime;
      });
    } else if (sortField === "sbomName") {
      sortedProducts.sort((a, b) => {
        const aName = a.sbomName || "";
        const bName = b.sbomName || "";
        return sortDirection === "ASC"
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      });
    } else if (sortField === "sbomReportId") {
      sortedProducts.sort((a, b) => {
        const aId = a.sbomReportId || "";
        const bId = b.sbomReportId || "";
        return sortDirection === "ASC"
          ? aId.localeCompare(bId)
          : bId.localeCompare(aId);
      });
    }

    // Calculate pagination info
    const totalElements = sortedProducts.length;
    const totalPages = Math.ceil(totalElements / pageSize);

    // Apply pagination
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedProducts = sortedProducts.slice(start, end);

    return HttpResponse.json(paginatedProducts, {
      headers: {
        "X-Total-Elements": totalElements.toString(),
        "X-Total-Pages": totalPages.toString(),
      },
    });
  }),

  // GET /api/v1/sbom-reports/:sbomReportId - Get SBOM report data by ID
  http.get("/api/v1/sbom-reports/:sbomReportId", ({ params }) => {
    const { sbomReportId } = params;
    const product = mockProducts.find((p) => p.sbomReportId === sbomReportId);

    if (!product) {
      return HttpResponse.json({ error: "SBOM report not found" }, { status: 404 });
    }

    return HttpResponse.json(product);
  }),

  // GET /api/v1/reports - List analysis reports
  http.get("/api/v1/reports", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "100", 10);
    const sbomReportId = url.searchParams.get("sbomReportId");
    const vulnId = url.searchParams.get("vulnId");
    const status = url.searchParams.get("status");

    let filteredReports = [...mockReports];

    // Apply filters
    if (sbomReportId) {
      filteredReports = filteredReports.filter(
        (r) => r.metadata?.productId === sbomReportId // Note: Will be sbomReportId when types are updated
      );
    }

    if (vulnId) {
      filteredReports = filteredReports.filter((r) => {
        // Check if any vulnerability in the report matches the vulnId
        return r.vulns?.some((v) => v.vulnId === vulnId);
      });
    }

    if (status) {
      filteredReports = filteredReports.filter((r) => r.state === status);
    }

    // Calculate pagination info
    const totalElements = filteredReports.length;
    const totalPages = Math.ceil(totalElements / pageSize);

    // Apply pagination
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedReports = filteredReports.slice(start, end);

    return HttpResponse.json(paginatedReports, {
      headers: {
        "X-Total-Elements": totalElements.toString(),
        "X-Total-Pages": totalPages.toString(),
      },
    });
  }),

  // GET /api/v1/reports/:id - Get analysis report by ID (FullReport)
  http.get("/api/v1/reports/:id", ({ params }) => {
    const { id } = params as { id: string };
    
    // First check if we have a FullReport mock
    const fullReport = mockFullReports[id];
    if (fullReport) {
      // Return as JSON string (as per API contract - backend returns String)
      // HttpResponse.text() returns the string directly without double-encoding
      return HttpResponse.text(JSON.stringify(fullReport), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback to Report summary if no FullReport exists
    const report = mockReports.find((r) => r.id === id);
    if (!report) {
      return HttpResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Return as string (as per API contract)
    return HttpResponse.text(JSON.stringify(report), {
      headers: { "Content-Type": "application/json" },
    });
  }),

  // GET /api/v1/reports/summary - Get reports summary
  http.get("/api/v1/reports/summary", () => {
    return HttpResponse.json(generateMockReportsSummary());
  }),

  // POST /api/v1/reports/new - Create new analysis request
  http.post("/api/v1/reports/new", async ({ request }) => {
    const body = (await request.json()) as any;

    // Generate a new report ID
    const newReportId = `report-${Date.now()}`;
    const newProductId = body?.productId || `product-${Date.now()}`;
    const now = new Date().toISOString();

    // Create a new report
    const newReport: Report = {
      id: newReportId,
      name: body?.name || `New Report ${newReportId}`,
      startedAt: now,
      completedAt: "",
      imageName: body?.imageName || "unknown",
      imageTag: body?.imageTag || "latest",
      state: "pending",
      vulns: [],
      metadata: {
        productId: newProductId,
        ...body?.metadata,
      },
    };

    mockReports.push(newReport);

    // Return ReportData format (simplified)
    return HttpResponse.json({
      id: newReportId,
      state: "pending",
    });
  }),

  // DELETE /api/v1/reports/:id - Delete analysis report
  http.delete("/api/v1/reports/:id", ({ params }) => {
    const { id } = params;
    const index = mockReports.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json({ error: "Report not found" }, { status: 404 });
    }

    mockReports.splice(index, 1);
    return HttpResponse.json({ message: "Report deleted successfully" });
  }),

  // DELETE /api/v1/products/:productId - Delete product by ID
  http.delete("/api/v1/products/:productId", ({ params }) => {
    const { productId } = params;
    const productIndices: number[] = [];
    
    // Find all products with this productId (since there can be multiple per productId, one per CVE)
    mockProducts.forEach((p, index) => {
      if (p.sbomReportId === productId) {
        productIndices.push(index);
      }
    });

    if (productIndices.length === 0) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Remove products in reverse order to maintain indices
    productIndices.reverse().forEach((index) => {
      mockProducts.splice(index, 1);
    });

    // Also remove associated reports
    const reportsToRemove = mockReports.filter(
      (r) => r.metadata?.productId === productId
    );
    reportsToRemove.forEach((report) => {
      const reportIndex = mockReports.findIndex((r) => r.id === report.id);
      if (reportIndex !== -1) {
        mockReports.splice(reportIndex, 1);
      }
    });

    return HttpResponse.json({ message: "Product deleted successfully" });
  }),

  // POST /api/v1/reports/:id/submit - Submit to ExploitIQ
  http.post("/api/v1/reports/:id/submit", ({ params }) => {
    const { id } = params;
    const report = mockReports.find((r) => r.id === id);

    if (!report) {
      return HttpResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report state
    report.state = "sent";

    return HttpResponse.json("Request submitted successfully");
  }),

  // POST /api/reports/:id/retry - Retry analysis request
  http.post("/api/reports/:id/retry", ({ params }) => {
    const { id } = params;
    const report = mockReports.find((r) => r.id === id);

    if (!report) {
      return HttpResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Reset report state
    report.state = "pending";

    return HttpResponse.json("Retry request accepted");
  }),

  // GET /api/vulnerabilities - List vulnerabilities
  http.get("/api/vulnerabilities", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "1000", 10);

    const mockVulnerabilities = [
      {
        id: "CVE-2024-1234",
        description: "Sample vulnerability description",
        severity: "HIGH",
        publishedDate: new Date().toISOString(),
      },
      {
        id: "CVE-2024-5678",
        description: "Another vulnerability description",
        severity: "MEDIUM",
        publishedDate: new Date().toISOString(),
      },
    ];

    const start = page * pageSize;
    const end = start + pageSize;
    const paginated = mockVulnerabilities.slice(start, end);

    return HttpResponse.json(paginated);
  }),

  // Fallback handler for unhandled requests
  http.all("*", ({ request }) => {
    console.warn(`[MSW] Unhandled request: ${request.method} ${request.url}`);
    return HttpResponse.json(
      { error: "Mock handler not implemented for this endpoint" },
      { status: 501 }
    );
  }),
];
