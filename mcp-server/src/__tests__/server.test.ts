import { describe, it, expect, vi } from "vitest";
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

async function createTestClient() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return { client, server };
}

describe("MCP Server", () => {
  it("creates server with correct name and version", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("registers all 12 tools", async () => {
    const { client } = await createTestClient();
    const result = await client.listTools();

    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain("health_check");
    expect(toolNames).toContain("analyze_cve");
    expect(toolNames).toContain("analyze_spdx_sbom");
    expect(toolNames).toContain("analyze_cyclonedx_sbom");
    expect(toolNames).toContain("list_cve_reports");
    expect(toolNames).toContain("get_cve_report");
    expect(toolNames).toContain("get_cve_report_by_scan_id");
    expect(toolNames).toContain("delete_cve_report");
    expect(toolNames).toContain("retry_cve_analysis");
    expect(toolNames).toContain("list_products");
    expect(toolNames).toContain("get_product");
    expect(toolNames).toContain("delete_product");
    expect(result.tools).toHaveLength(12);
  });

  it("registers all 12 prompts", async () => {
    const { client } = await createTestClient();
    const result = await client.listPrompts();
    expect(result.prompts).toHaveLength(12);
  });

  it("tools have descriptions", async () => {
    const { client } = await createTestClient();
    const result = await client.listTools();

    for (const tool of result.tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.description!.length).toBeGreaterThan(10);
    }
  });

  it("prompts have descriptions", async () => {
    const { client } = await createTestClient();
    const result = await client.listPrompts();

    for (const prompt of result.prompts) {
      expect(prompt.description).toBeTruthy();
      expect(prompt.description!.length).toBeGreaterThan(10);
    }
  });
});
