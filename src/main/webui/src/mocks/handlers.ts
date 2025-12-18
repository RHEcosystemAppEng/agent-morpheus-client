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
  ProductSummary,
  ReportsSummary,
  Report,
  VulnResult,
} from "../generated-client";

// Mock data generators with varied scenarios
const generateMockProductSummary = (
  id: string,
  name: string,
  options?: {
    state?: "completed" | "pending" | "analyzing";
    submittedCount?: number;
    completedCount?: number;
    failedCount?: number;
    pendingCount?: number;
    hasVulnerabilities?: boolean;
    cveCount?: number;
  }
): ProductSummary => {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(
    Date.now() - 2 * 24 * 60 * 60 * 1000
  ).toISOString();

  const state = options?.state || "completed";
  const submittedCount = options?.submittedCount ?? 10;
  const completedCount =
    options?.completedCount ?? Math.floor(submittedCount * 0.8);
  const failedCount = options?.failedCount ?? Math.floor(submittedCount * 0.1);
  const pendingCount =
    options?.pendingCount ?? submittedCount - completedCount - failedCount;
  const hasVulnerabilities = options?.hasVulnerabilities ?? true;
  const cveCount = options?.cveCount ?? 2;

  // Generate CVEs
  const cves: Record<string, Array<{ status: string; label: string }>> = {};
  const cveStatusCounts: Record<string, Record<string, number>> = {};

  for (let i = 1; i <= cveCount; i++) {
    const cveId = `CVE-2024-${1000 + i}`;
    const isVulnerable = hasVulnerabilities && i === 1;

    cves[cveId] = [
      {
        status: isVulnerable ? "TRUE" : "FALSE",
        label: isVulnerable ? "vulnerable" : "not_vulnerable",
      },
    ];

    if (isVulnerable) {
      cveStatusCounts[cveId] = {
        TRUE: Math.floor(completedCount * 0.4),
        FALSE: Math.floor(completedCount * 0.3),
        UNKNOWN: Math.floor(completedCount * 0.2),
      };
    } else {
      cveStatusCounts[cveId] = {
        FALSE: completedCount,
      };
    }
  }

  return {
    data: {
      id,
      name,
      version: "1.0.0",
      submittedAt: state === "analyzing" ? twoDaysAgo : yesterday,
      submittedCount,
      metadata: {
        environment: "production",
        team: "security",
      },
      submissionFailures: [],
      completedAt: state === "completed" ? now : undefined,
    },
    summary: {
      productState: state === "analyzing" ? "analyzing" : state,
      componentStates: {
        completed: completedCount,
        failed: failedCount,
        pending: pendingCount,
      },
      cves,
      cveStatusCounts,
    },
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
// Create diverse product summaries with different states and repository counts
const mockProducts: ProductSummary[] = [
  // Product 1: Completed with vulnerabilities, 25 repositories
  generateMockProductSummary("product-1", "Sample Product A", {
    state: "completed",
    submittedCount: 25,
    completedCount: 22,
    failedCount: 2,
    pendingCount: 1,
    hasVulnerabilities: true,
    cveCount: 3,
  }),

  // Product 2: Still analyzing, 50 repositories
  generateMockProductSummary("product-2", "Sample Product B", {
    state: "analyzing",
    submittedCount: 50,
    completedCount: 35,
    failedCount: 3,
    pendingCount: 12,
    hasVulnerabilities: true,
    cveCount: 2,
  }),

  // Product 3: Completed with NOT VULNERABLE + UNCERTAIN (no vulnerable repos), 15 repositories
  {
    data: {
      id: "product-3",
      name: "Sample Product C",
      version: "1.0.0",
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      submittedCount: 15,
      metadata: {
        environment: "production",
        team: "security",
      },
      submissionFailures: [],
      completedAt: new Date().toISOString(),
    },
    summary: {
      productState: "completed",
      componentStates: {
        completed: 15,
        failed: 0,
        pending: 0,
      },
      cves: {
        "CVE-2024-1003": [
          {
            status: "FALSE",
            label: "not_vulnerable",
          },
        ],
        "CVE-2024-1004": [
          {
            status: "UNKNOWN",
            label: "uncertain",
          },
        ],
      },
      cveStatusCounts: {
        "CVE-2024-1003": {
          FALSE: 10, // 10 repos not vulnerable
          UNKNOWN: 5, // 5 repos uncertain
        },
        "CVE-2024-1004": {
          FALSE: 8, // 8 repos not vulnerable
          UNKNOWN: 7, // 7 repos uncertain
        },
      },
    },
  },

  // Product 4: Pending analysis, 8 repositories
  generateMockProductSummary("product-4", "Sample Product D", {
    state: "pending",
    submittedCount: 8,
    completedCount: 0,
    failedCount: 0,
    pendingCount: 8,
    hasVulnerabilities: false,
    cveCount: 0,
  }),

  // Product 5: Completed with many repositories, 100 repositories
  generateMockProductSummary("product-5", "Sample Product E", {
    state: "completed",
    submittedCount: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: true,
    cveCount: 5,
  }),

  // Product 6: Analyzing with medium repository count, 30 repositories
  generateMockProductSummary("product-6", "Sample Product F", {
    state: "analyzing",
    submittedCount: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: true,
    cveCount: 4,
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
  // GET /api/reports/product - List all product data
  http.get("/api/reports/product", () => {
    return HttpResponse.json(mockProducts);
  }),

  // GET /api/reports/product/:id - Get product data by ID
  http.get("/api/reports/product/:id", ({ params }) => {
    const { id } = params;
    const product = mockProducts.find((p) => p.data.id === id);

    if (!product) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return HttpResponse.json(product);
  }),

  // GET /api/reports - List analysis reports
  http.get("/api/reports", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "100", 10);
    const productId = url.searchParams.get("productId");
    const status = url.searchParams.get("status");

    let filteredReports = [...mockReports];

    // Apply filters
    if (productId) {
      filteredReports = filteredReports.filter(
        (r) => r.metadata?.productId === productId
      );
    }

    if (status) {
      filteredReports = filteredReports.filter((r) => r.state === status);
    }

    // Apply pagination
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedReports = filteredReports.slice(start, end);

    return HttpResponse.json(paginatedReports);
  }),

  // GET /api/reports/:id - Get analysis report by ID
  http.get("/api/reports/:id", ({ params }) => {
    const { id } = params;
    const report = mockReports.find((r) => r.id === id);

    if (!report) {
      return HttpResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Return as string (as per API contract)
    return HttpResponse.json(JSON.stringify(report));
  }),

  // GET /api/reports/summary - Get reports summary
  http.get("/api/reports/summary", () => {
    return HttpResponse.json(generateMockReportsSummary());
  }),

  // POST /api/reports/new - Create new analysis request
  http.post("/api/reports/new", async ({ request }) => {
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

  // DELETE /api/reports/:id - Delete analysis report
  http.delete("/api/reports/:id", ({ params }) => {
    const { id } = params;
    const index = mockReports.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json({ error: "Report not found" }, { status: 404 });
    }

    mockReports.splice(index, 1);
    return HttpResponse.json({ message: "Report deleted successfully" });
  }),

  // DELETE /api/reports/product/:id - Delete product by ID
  http.delete("/api/reports/product/:id", ({ params }) => {
    const { id } = params;
    const productIndex = mockProducts.findIndex((p) => p.data.id === id);

    if (productIndex === -1) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }

    mockProducts.splice(productIndex, 1);
    // Also remove associated reports
    const reportsToRemove = mockReports.filter(
      (r) => r.metadata?.productId === id
    );
    reportsToRemove.forEach((report) => {
      const reportIndex = mockReports.findIndex((r) => r.id === report.id);
      if (reportIndex !== -1) {
        mockReports.splice(reportIndex, 1);
      }
    });

    return HttpResponse.json({ message: "Product deleted successfully" });
  }),

  // POST /api/reports/:id/submit - Submit to ExploitIQ
  http.post("/api/reports/:id/submit", ({ params }) => {
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
