import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js";

// Mock the generated services (required for server creation)
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

async function createTestClient() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return { client, server };
}

describe("Prompts", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("lists all registered prompts", async () => {
    const { client } = await createTestClient();
    const result = await client.listPrompts();

    const promptNames = result.prompts.map((p) => p.name);
    expect(promptNames).toContain("analyze-cve");
    expect(promptNames).toContain("analyze-spdx-sbom");
    expect(promptNames).toContain("analyze-cyclonedx-sbom");
    expect(promptNames).toContain("get-cve-report");
    expect(promptNames).toContain("get-cve-report-by-scan-id");
    expect(promptNames).toContain("list-cve-reports");
    expect(promptNames).toContain("delete-cve-report");
    expect(promptNames).toContain("retry-cve-analysis");
    expect(promptNames).toContain("list-products");
    expect(promptNames).toContain("get-product");
    expect(promptNames).toContain("delete-product");
    expect(promptNames).toContain("health-check");
    expect(result.prompts).toHaveLength(12);
  });

  describe("analyze-cve prompt", () => {
    it("generates correct message for public repo", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "analyze-cve",
        arguments: {
          cveId: "CVE-2024-51744",
          sourceRepo: "https://github.com/openshift/assisted-installer",
          commitId: "ab9e2ade",
        },
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("CVE-2024-51744");
      expect(text).toContain("https://github.com/openshift/assisted-installer");
      expect(text).toContain("ab9e2ade");
    });

    it("includes credential info when provided", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "analyze-cve",
        arguments: {
          cveId: "CVE-2024-1234",
          sourceRepo: "https://github.com/private/repo",
          commitId: "deadbeef",
          secretValue: "ghp_token",
          userName: "myuser",
        },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("credentials");
      expect(text).toContain("myuser");
    });
  });

  describe("analyze-spdx-sbom prompt", () => {
    it("generates message with file path", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "analyze-spdx-sbom",
        arguments: { filePath: "/path/to/sbom.spdx.json" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("/path/to/sbom.spdx.json");
    });

    it("includes CVE ID when provided", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "analyze-spdx-sbom",
        arguments: { filePath: "/path/to/sbom.json", cveId: "CVE-2024-5678" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("CVE-2024-5678");
    });
  });

  describe("analyze-cyclonedx-sbom prompt", () => {
    it("generates message with file path", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "analyze-cyclonedx-sbom",
        arguments: { filePath: "/path/to/sbom.cdx.json" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("/path/to/sbom.cdx.json");
    });
  });

  describe("simple prompts", () => {
    it("get-cve-report generates correct message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "get-cve-report",
        arguments: { id: "abc123def456" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("abc123def456");
    });

    it("get-cve-report-by-scan-id generates correct message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "get-cve-report-by-scan-id",
        arguments: { scanId: "scan-xyz" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("scan-xyz");
    });

    it("delete-cve-report generates correct message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "delete-cve-report",
        arguments: { id: "report-to-delete" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("report-to-delete");
    });

    it("retry-cve-analysis generates correct message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "retry-cve-analysis",
        arguments: { id: "failed-report" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("failed-report");
    });

    it("get-product generates correct message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "get-product",
        arguments: { id: "prod-4" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("prod-4");
    });

    it("delete-product generates correct message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "delete-product",
        arguments: { id: "prod-to-delete" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("prod-to-delete");
    });

    it("health-check generates correct message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "health-check",
        arguments: {},
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("healthy");
    });
  });

  describe("list-cve-reports prompt", () => {
    it("generates message with no filters", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "list-cve-reports",
        arguments: {},
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("List");
      expect(text).toContain("reports");
    });

    it("includes filters in message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "list-cve-reports",
        arguments: {
          vulnId: "CVE-2024-1234",
          status: "completed",
          exploitIqStatus: "TRUE",
        },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("CVE-2024-1234");
      expect(text).toContain("completed");
      expect(text).toContain("TRUE");
    });
  });

  describe("list-products prompt", () => {
    it("generates message with filters", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "list-products",
        arguments: { name: "Product_3", cveId: "CVE-2024-44337" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("Product_3");
      expect(text).toContain("CVE-2024-44337");
    });

    it("includes sort info in message", async () => {
      const { client } = await createTestClient();
      const result = await client.getPrompt({
        name: "list-products",
        arguments: { sortField: "name", sortDirection: "ASC" },
      });

      const text = (result.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("name");
      expect(text).toContain("ASC");
    });
  });
});
