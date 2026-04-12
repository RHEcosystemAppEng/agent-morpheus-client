import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js";

// Mock the generated services
vi.mock("../generated/services/ReportEndpointService.js", () => ({
  ReportEndpointService: {
    getApiV1Reports: vi.fn(),
    getApiV1Reports1: vi.fn(),
    getApiV1ReportsByScanId: vi.fn(),
    deleteApiV1Reports1: vi.fn(),
    postApiV1ReportsRetry: vi.fn(),
    postApiV1ReportsNew: vi.fn(),
    getApiV1ReportsProduct1: vi.fn(),
  },
}));

vi.mock("../generated/services/ProductEndpointService.js", () => ({
  ProductEndpointService: {
    getApiV1Products: vi.fn(),
    deleteApiV1Products: vi.fn(),
    postApiV1ProductsUploadSpdx: vi.fn(),
    postApiV1ProductsUploadCyclonedx: vi.fn(),
  },
}));

vi.mock("../generated/core/OpenAPI.js", () => ({
  OpenAPI: { BASE: "http://localhost:8080", TOKEN: undefined },
}));

import { ReportEndpointService } from "../generated/services/ReportEndpointService.js";
import { ProductEndpointService } from "../generated/services/ProductEndpointService.js";

async function createTestClient() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return { client, server };
}

describe("Health Tool", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns health status when service is up", async () => {
    const mockHealth = { status: "UP", checks: [{ name: "engine", status: "UP" }] };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => mockHealth,
    } as Response);

    const { client } = await createTestClient();
    const result = await client.callTool({ name: "health_check", arguments: {} });

    expect(result.content).toHaveLength(1);
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.status).toBe("UP");
  });

  it("returns error when service is down", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Connection refused"));

    const { client } = await createTestClient();
    const result = await client.callTool({ name: "health_check", arguments: {} });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain("Connection refused");
  });
});

describe("Report Tools", () => {
  beforeEach(() => vi.restoreAllMocks());

  describe("list_cve_reports", () => {
    it("returns paginated reports", async () => {
      const mockReports = [
        { id: "abc123", scanId: "scan-1", state: "completed", vulns: [{ vulnId: "CVE-2024-1234" }] },
      ];
      vi.mocked(ReportEndpointService.getApiV1Reports).mockResolvedValueOnce(mockReports as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "list_cve_reports",
        arguments: { page: 0, pageSize: 10 },
      });

      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("abc123");
    });

    it("passes filter parameters correctly", async () => {
      vi.mocked(ReportEndpointService.getApiV1Reports).mockResolvedValueOnce([] as any);

      const { client } = await createTestClient();
      await client.callTool({
        name: "list_cve_reports",
        arguments: {
          status: "failed",
          vulnId: "CVE-2024-5678",
          exploitIqStatus: "TRUE",
          withoutProduct: "true",
        },
      });

      expect(ReportEndpointService.getApiV1Reports).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          vulnId: "CVE-2024-5678",
          exploitIqStatus: "TRUE",
          withoutProduct: "true",
        }),
      );
    });

    it("returns error on API failure", async () => {
      vi.mocked(ReportEndpointService.getApiV1Reports).mockRejectedValueOnce(new Error("Server error"));

      const { client } = await createTestClient();
      const result = await client.callTool({ name: "list_cve_reports", arguments: {} });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("Server error");
    });
  });

  describe("get_cve_report", () => {
    it("returns report by ID", async () => {
      const mockReport = { report: { _id: "abc123", input: { scan: { id: "scan-1" } } } };
      vi.mocked(ReportEndpointService.getApiV1Reports1).mockResolvedValueOnce(mockReport as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "get_cve_report",
        arguments: { id: "abc123" },
      });

      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.report._id).toBe("abc123");
    });

    it("returns error for non-existent report", async () => {
      vi.mocked(ReportEndpointService.getApiV1Reports1).mockRejectedValueOnce(new Error("Not Found"));

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "get_cve_report",
        arguments: { id: "nonexistent" },
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("get_cve_report_by_scan_id", () => {
    it("returns report by scan ID", async () => {
      const mockReport = { report: { input: { scan: { id: "scan-abc" } } }, status: "completed" };
      vi.mocked(ReportEndpointService.getApiV1ReportsByScanId).mockResolvedValueOnce(mockReport as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "get_cve_report_by_scan_id",
        arguments: { scanId: "scan-abc" },
      });

      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.status).toBe("completed");
    });
  });

  describe("delete_cve_report", () => {
    it("handles successful deletion (undefined response)", async () => {
      vi.mocked(ReportEndpointService.deleteApiV1Reports1).mockResolvedValueOnce(undefined as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "delete_cve_report",
        arguments: { id: "abc123" },
      });

      // Should not error - formatResult handles undefined via ?? null
      expect(result.isError).toBeUndefined();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toBe("null");
    });

    it("handles deletion with response body", async () => {
      vi.mocked(ReportEndpointService.deleteApiV1Reports1).mockResolvedValueOnce({ deleted: true } as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "delete_cve_report",
        arguments: { id: "abc123" },
      });

      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.deleted).toBe(true);
    });

    it("returns error when report not found", async () => {
      vi.mocked(ReportEndpointService.deleteApiV1Reports1).mockRejectedValueOnce(new Error("Not Found"));

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "delete_cve_report",
        arguments: { id: "nonexistent" },
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("retry_cve_analysis", () => {
    it("handles successful retry (string response)", async () => {
      vi.mocked(ReportEndpointService.postApiV1ReportsRetry).mockResolvedValueOnce("new-report-id-123");

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "retry_cve_analysis",
        arguments: { id: "abc123" },
      });

      expect(result.isError).toBeUndefined();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(JSON.parse(text)).toBe("new-report-id-123");
    });

    it("handles retry with undefined response (no body)", async () => {
      vi.mocked(ReportEndpointService.postApiV1ReportsRetry).mockResolvedValueOnce(undefined as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "retry_cve_analysis",
        arguments: { id: "abc123" },
      });

      // Should not crash - formatResult handles undefined via ?? null
      expect(result.isError).toBeUndefined();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toBe("null");
    });

    it("returns error for non-existent report", async () => {
      vi.mocked(ReportEndpointService.postApiV1ReportsRetry).mockRejectedValueOnce(new Error("Not Found"));

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "retry_cve_analysis",
        arguments: { id: "nonexistent" },
      });

      expect(result.isError).toBe(true);
    });
  });
});

describe("Analysis Tools", () => {
  beforeEach(() => vi.restoreAllMocks());

  describe("analyze_cve", () => {
    it("submits CVE analysis for public repo", async () => {
      const mockResponse = {
        reportRequestId: { id: "req-123", reportId: "report-456" },
        report: { input: { scan: { id: "scan-789" } } },
      };
      vi.mocked(ReportEndpointService.postApiV1ReportsNew).mockResolvedValueOnce(mockResponse as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "analyze_cve",
        arguments: {
          cveId: "CVE-2024-51744",
          sourceRepo: "https://github.com/openshift/assisted-installer",
          commitId: "ab9e2ade",
        },
      });

      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.reportRequestId.id).toBe("req-123");

      expect(ReportEndpointService.postApiV1ReportsNew).toHaveBeenCalledWith({
        requestBody: expect.objectContaining({
          analysisType: "source",
          vulnerabilities: ["CVE-2024-51744"],
          sourceRepo: "https://github.com/openshift/assisted-installer",
          commitId: "ab9e2ade",
          metadata: {},
        }),
      });
    });

    it("submits CVE analysis with credentials", async () => {
      vi.mocked(ReportEndpointService.postApiV1ReportsNew).mockResolvedValueOnce({} as any);

      const { client } = await createTestClient();
      await client.callTool({
        name: "analyze_cve",
        arguments: {
          cveId: "CVE-2024-1234",
          sourceRepo: "https://github.com/private/repo",
          commitId: "deadbeef",
          secretValue: "ghp_token123",
          userName: "myuser",
        },
      });

      expect(ReportEndpointService.postApiV1ReportsNew).toHaveBeenCalledWith({
        requestBody: expect.objectContaining({
          credential: { secretValue: "ghp_token123", userName: "myuser" },
        }),
      });
    });

    it("does not include credential when secretValue is absent", async () => {
      vi.mocked(ReportEndpointService.postApiV1ReportsNew).mockResolvedValueOnce({} as any);

      const { client } = await createTestClient();
      await client.callTool({
        name: "analyze_cve",
        arguments: {
          cveId: "CVE-2024-1234",
          sourceRepo: "https://github.com/public/repo",
          commitId: "abc123",
        },
      });

      const call = vi.mocked(ReportEndpointService.postApiV1ReportsNew).mock.calls[0][0];
      expect(call.requestBody.credential).toBeUndefined();
    });

    it("returns error on submission failure", async () => {
      vi.mocked(ReportEndpointService.postApiV1ReportsNew).mockRejectedValueOnce(
        new Error("Unprocessable Entity"),
      );

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "analyze_cve",
        arguments: {
          cveId: "CVE-2024-1234",
          sourceRepo: "https://github.com/repo",
          commitId: "abc",
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("Unprocessable Entity");
    });
  });

  describe("analyze_spdx_sbom", () => {
    it("returns error when file does not exist", async () => {
      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "analyze_spdx_sbom",
        arguments: { filePath: "/nonexistent/sbom.spdx.json" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("Error");
    });
  });

  describe("analyze_cyclonedx_sbom", () => {
    it("returns error when file does not exist", async () => {
      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "analyze_cyclonedx_sbom",
        arguments: { filePath: "/nonexistent/sbom.cdx.json" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("Error");
    });
  });
});

describe("Product Tools", () => {
  beforeEach(() => vi.restoreAllMocks());

  describe("list_products", () => {
    it("returns paginated products", async () => {
      const mockProducts = [
        { data: { id: "prod-1", name: "Product_1" }, summary: { productState: "completed" } },
      ];
      vi.mocked(ProductEndpointService.getApiV1Products).mockResolvedValueOnce(mockProducts as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "list_products",
        arguments: { page: 0, pageSize: 5 },
      });

      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].data.id).toBe("prod-1");
    });

    it("passes filter parameters", async () => {
      vi.mocked(ProductEndpointService.getApiV1Products).mockResolvedValueOnce([] as any);

      const { client } = await createTestClient();
      await client.callTool({
        name: "list_products",
        arguments: { cveId: "CVE-2024-44337", name: "Product_3" },
      });

      expect(ProductEndpointService.getApiV1Products).toHaveBeenCalledWith(
        expect.objectContaining({ cveId: "CVE-2024-44337", name: "Product_3" }),
      );
    });
  });

  describe("get_product", () => {
    it("returns product by ID", async () => {
      const mockProduct = { data: { id: "prod-4", name: "Product_4" }, summary: { productState: "completed" } };
      vi.mocked(ReportEndpointService.getApiV1ReportsProduct1).mockResolvedValueOnce(mockProduct as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "get_product",
        arguments: { id: "prod-4" },
      });

      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.data.id).toBe("prod-4");
    });
  });

  describe("delete_product", () => {
    it("handles successful deletion (undefined response)", async () => {
      vi.mocked(ProductEndpointService.deleteApiV1Products).mockResolvedValueOnce(undefined as any);

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "delete_product",
        arguments: { id: "prod-1" },
      });

      expect(result.isError).toBeUndefined();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toBe("null");
    });

    it("returns error on failure", async () => {
      vi.mocked(ProductEndpointService.deleteApiV1Products).mockRejectedValueOnce(
        new Error("Internal server error"),
      );

      const { client } = await createTestClient();
      const result = await client.callTool({
        name: "delete_product",
        arguments: { id: "prod-1" },
      });

      expect(result.isError).toBe(true);
    });
  });
});
