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
  ProductSummary,
} from "../generated-client";
import { mockFullReports } from "./mockFullReports";

// Mock data generators with varied scenarios
const generateMockProductSummary = (
  productId: string,
  productName: string,
  productVersion: string,
  cveId: string,
  options?: {
    state?: "completed" | "pending" | "analyzing";
    numReports?: number;
    completedCount?: number;
    failedCount?: number;
    pendingCount?: number;
    hasVulnerabilities?: boolean;
  }
): ProductSummary => {
  const now = new Date().toISOString();

  const state = options?.state || "completed";
  const numReports = options?.numReports ?? 10;
  const completedCount =
    options?.completedCount ?? Math.floor(numReports * 0.8);
  const failedCount = options?.failedCount ?? Math.floor(numReports * 0.1);
  const pendingCount =
    options?.pendingCount ?? numReports - completedCount - failedCount;
  const hasVulnerabilities = options?.hasVulnerabilities ?? true;

  // Generate justification status counts
  const justificationStatusCounts: Record<string, number> = {};
  if (hasVulnerabilities) {
    justificationStatusCounts.TRUE = Math.floor(completedCount * 0.4);
    justificationStatusCounts.FALSE = Math.floor(completedCount * 0.3);
    justificationStatusCounts.UNKNOWN = Math.floor(completedCount * 0.2);
  } else {
    justificationStatusCounts.FALSE = completedCount;
  }

  // Generate status counts
  const statusCounts: Record<string, number> = {
    completed: completedCount,
    failed: failedCount,
    pending: pendingCount,
  };

  // Generate submittedAt timestamp (2 days ago for variety)
  const submittedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const productState = state === "completed" ? "completed" : "analysing";

  return {
    data: {
      id: productId,
      name: productName,
      version: productVersion,
      cveId,
      submittedAt,
      submittedCount: numReports,
      completedAt: state === "completed" ? now : undefined,
      metadata: {},
      submissionFailures: [],
    },
    summary: {
      productState,
      statusCounts,
      justificationStatusCounts,
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
// Create diverse products with different states and repository counts
const mockProducts: ProductSummary[] = [
  // Product 1: Completed with vulnerabilities, 25 repositories
  generateMockProductSummary("product-1", "Sample Product A", "1.0.0", "CVE-2024-1001", {
    state: "completed",
    numReports: 25,
    completedCount: 22,
    failedCount: 2,
    pendingCount: 1,
    hasVulnerabilities: true,
  }),

  // Product 2: Still analyzing, 50 repositories
  generateMockProductSummary("product-2", "Sample Product B", "2.1.0", "CVE-2024-1004", {
    state: "analyzing",
    numReports: 50,
    completedCount: 35,
    failedCount: 3,
    pendingCount: 12,
    hasVulnerabilities: true,
  }),

  // Product 3: Completed with NOT VULNERABLE + UNCERTAIN (no vulnerable repos), 15 repositories
  {
    data: {
      id: "product-3",
      name: "Sample Product C",
      version: "3.0.0",
      cveId: "CVE-2024-1003",
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      submittedCount: 15,
      completedAt: new Date().toISOString(),
      metadata: {},
      submissionFailures: [],
    },
    summary: {
      productState: "completed",
      statusCounts: {
        completed: 15,
        failed: 0,
        pending: 0,
      },
      justificationStatusCounts: {
        FALSE: 10, // 10 repos not vulnerable
        UNKNOWN: 5, // 5 repos uncertain
      },
    },
  },
    completedAt: new Date().toISOString(),
    metadata: {},
    submissionFailures: [],
  },

  // Product 4: Pending analysis, 8 repositories
  generateMockProductSummary("product-4", "Sample Product D", "4.0.0", "CVE-2024-1006", {
    state: "pending",
    numReports: 8,
    completedCount: 0,
    failedCount: 0,
    pendingCount: 8,
    hasVulnerabilities: false,
  }),

  // Product 5: Completed with many repositories, 100 repositories
  generateMockProductSummary("product-5", "Sample Product E", "5.0.0", "CVE-2024-1007", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: true,
  }),
  generateMockProductSummary("product-5", "Sample Product E", "5.0.0", "CVE-2024-1008", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),
  generateMockProductSummary("product-5", "Sample Product E", "5.0.0", "CVE-2024-1009", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),
  generateMockProductSummary("product-5", "Sample Product E", "5.0.0", "CVE-2024-1010", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),
  generateMockProductSummary("product-5", "Sample Product E", "5.0.0", "CVE-2024-1011", {
    state: "completed",
    numReports: 100,
    completedCount: 95,
    failedCount: 3,
    pendingCount: 2,
    hasVulnerabilities: false,
  }),

  // Product 6: Analyzing with medium repository count, 30 repositories, 4 CVEs
  generateMockProductSummary("product-6", "Sample Product F", "6.0.0", "CVE-2024-1012", {
    state: "analyzing",
    numReports: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: true,
  }),
  generateMockProductSummary("product-6", "Sample Product F", "6.0.0", "CVE-2024-1013", {
    state: "analyzing",
    numReports: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: false,
  }),
  generateMockProductSummary("product-6", "Sample Product F", "6.0.0", "CVE-2024-1014", {
    state: "analyzing",
    numReports: 30,
    completedCount: 20,
    failedCount: 2,
    pendingCount: 8,
    hasVulnerabilities: false,
  }),
  generateMockProductSummary("product-6", "Sample Product F", "6.0.0", "CVE-2024-1015", {
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
  // GET /api/v1/reports/product - List all products
  http.get("/api/v1/reports/product", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "100", 10);
    const sortField = url.searchParams.get("sortField") || "submittedAt";
    const sortDirection = url.searchParams.get("sortDirection") || "DESC";
    const name = url.searchParams.get("name");
    const cveId = url.searchParams.get("cveId");

    // Apply filters
    let filteredProducts = [...mockProducts];
    if (name) {
      const nameLower = name.toLowerCase();
      filteredProducts = filteredProducts.filter((p) =>
        p.data.name?.toLowerCase().includes(nameLower)
      );
    }
    if (cveId) {
      filteredProducts = filteredProducts.filter((p) => p.data.cveId === cveId);
    }

    // Apply sorting
    let sortedProducts = [...filteredProducts];
    if (sortField === "submittedAt") {
      sortedProducts.sort((a, b) => {
        const aTime = a.data.submittedAt ? new Date(a.data.submittedAt).getTime() : 0;
        const bTime = b.data.submittedAt ? new Date(b.data.submittedAt).getTime() : 0;
        return sortDirection === "ASC" ? aTime - bTime : bTime - aTime;
      });
    } else if (sortField === "name") {
      sortedProducts.sort((a, b) => {
        const aName = a.data.name || "";
        const bName = b.data.name || "";
        return sortDirection === "ASC"
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      });
    } else if (sortField === "completedAt") {
      sortedProducts.sort((a, b) => {
        const aTime = a.data.completedAt ? new Date(a.data.completedAt).getTime() : 0;
        const bTime = b.data.completedAt ? new Date(b.data.completedAt).getTime() : 0;
        return sortDirection === "ASC" ? aTime - bTime : bTime - aTime;
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

  // GET /api/v1/reports/product/:id - Get product data by ID
  http.get("/api/v1/reports/product/:id", ({ params }) => {
    const { id } = params;
    const product = mockProductSummaries.find((p) => p.data.id === id);

    if (!product) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  // GET /api/v1/reports - List analysis reports
  http.get("/api/v1/reports", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "100", 10);
    const productId = url.searchParams.get("productId");
    const vulnId = url.searchParams.get("vulnId");
    const status = url.searchParams.get("status");

    let filteredReports = [...mockReports];

    // Apply filters
    if (productId) {
      filteredReports = filteredReports.filter(
        (r) => r.metadata?.productId === productId // Note: Will be productId when types are updated
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
      if (p.productId === productId) {
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
