import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "analyze-cve",
    "Analyze a CVE vulnerability against a source code repository to determine exploitability",
    {
      cveId: z.string().describe("CVE ID to analyze (e.g., CVE-2024-1234)"),
      sourceRepo: z.string().describe("Source repository URL"),
      commitId: z.string().describe("Commit ID or reference"),
      secretValue: z.string().optional().describe("Secret value for private repository access (PAT or SSH key)"),
      userName: z.string().optional().describe("Git username (required for PAT authentication)"),
    },
    async ({ cveId, sourceRepo, commitId, secretValue, userName }) => {
      let text = `Analyze CVE ${cveId} on repo ${sourceRepo} at commit ${commitId}`;
      if (secretValue) text += ` using provided credentials`;
      if (userName) text += ` as user ${userName}`;
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    }
  );

  server.prompt(
    "analyze-spdx-sbom",
    "Analyze an SPDX SBOM file for CVE vulnerability exploitability",
    {
      filePath: z.string().describe("Path to the SPDX SBOM file"),
      cveId: z.string().optional().describe("CVE ID to analyze (optional)"),
      secretValue: z.string().optional().describe("Secret value for private repository access"),
      userName: z.string().optional().describe("Git username for private repository access"),
    },
    async ({ filePath, cveId, secretValue, userName }) => {
      let text = `Upload SPDX SBOM from ${filePath}`;
      if (cveId) text += ` for CVE ${cveId}`;
      if (secretValue) text += ` using provided credentials`;
      if (userName) text += ` as user ${userName}`;
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    }
  );

  server.prompt(
    "analyze-cyclonedx-sbom",
    "Analyze a CycloneDX SBOM file for CVE vulnerability exploitability",
    {
      filePath: z.string().describe("Path to the CycloneDX SBOM file"),
      cveId: z.string().optional().describe("CVE ID to analyze (optional)"),
      secretValue: z.string().optional().describe("Secret value for private repository access"),
      userName: z.string().optional().describe("Git username for private repository access"),
    },
    async ({ filePath, cveId, secretValue, userName }) => {
      let text = `Upload CycloneDX SBOM from ${filePath}`;
      if (cveId) text += ` for CVE ${cveId}`;
      if (secretValue) text += ` using provided credentials`;
      if (userName) text += ` as user ${userName}`;
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    }
  );

  server.prompt(
    "get-cve-report",
    "Get a specific CVE analysis report by ID",
    {
      id: z.string().describe("Report ID (24-character hexadecimal MongoDB ObjectId format)"),
    },
    async ({ id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Get report ${id}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "get-cve-report-by-scan-id",
    "Get a CVE analysis report by its scan ID",
    {
      scanId: z.string().describe("Scan ID of the report"),
    },
    async ({ scanId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Get report with scan ID ${scanId}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "list-cve-reports",
    "List CVE analysis reports with optional filters",
    {
      vulnId: z.string().optional().describe("Filter by vulnerability ID (CVE ID)"),
      imageName: z.string().optional().describe("Filter by image name"),
      status: z.string().optional().describe("Filter by status: completed, sent, failed, queued, expired, pending"),
      exploitIqStatus: z.string().optional().describe("Filter by ExploitIQ status: TRUE, FALSE, UNKNOWN"),
      withoutProduct: z.string().optional().describe("When true, return only reports without metadata.product_id"),
      page: z.string().optional().describe("Page number (0-based)"),
      pageSize: z.string().optional().describe("Number of items per page"),
      sortBy: z.string().optional().describe("Sort criteria in format 'field:direction'"),
    },
    async ({ vulnId, imageName, status, exploitIqStatus, withoutProduct, page, pageSize, sortBy }) => {
      let text = "List the latest reports";
      const filters: string[] = [];
      if (vulnId) filters.push(`CVE ${vulnId}`);
      if (imageName) filters.push(`image ${imageName}`);
      if (status) filters.push(`status ${status}`);
      if (exploitIqStatus) filters.push(`ExploitIQ status ${exploitIqStatus}`);
      if (withoutProduct) filters.push(`without product`);
      if (filters.length > 0) text += ` filtered by ${filters.join(" and ")}`;
      if (page) text += ` page ${page}`;
      if (pageSize) text += ` with ${pageSize} items per page`;
      if (sortBy) text += ` sorted by ${sortBy}`;
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    }
  );

  server.prompt(
    "delete-cve-report",
    "Delete a specific CVE analysis report by ID",
    {
      id: z.string().describe("Report ID to delete (24-character hexadecimal MongoDB ObjectId format)"),
    },
    async ({ id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Delete report ${id}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "retry-cve-analysis",
    "Retry a failed CVE analysis request",
    {
      id: z.string().describe("Report ID to retry (24-character hexadecimal MongoDB ObjectId format)"),
    },
    async ({ id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Retry analysis for report ${id}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "list-products",
    "List all products with optional filtering and sorting",
    {
      name: z.string().optional().describe("Filter by product name"),
      cveId: z.string().optional().describe("Filter by CVE ID"),
      page: z.string().optional().describe("Page number (0-based)"),
      pageSize: z.string().optional().describe("Number of items per page"),
      sortField: z.string().optional().describe("Field to sort by"),
      sortDirection: z.string().optional().describe("Sort direction: ASC or DESC"),
    },
    async ({ name, cveId, page, pageSize, sortField, sortDirection }) => {
      let text = "List all products";
      const filters: string[] = [];
      if (name) filters.push(`name ${name}`);
      if (cveId) filters.push(`CVE ${cveId}`);
      if (filters.length > 0) text += ` filtered by ${filters.join(" and ")}`;
      if (page) text += ` page ${page}`;
      if (pageSize) text += ` with ${pageSize} items per page`;
      if (sortField) text += ` sorted by ${sortField} ${sortDirection || "ASC"}`;
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    }
  );

  server.prompt(
    "get-product",
    "Get product data by ID including report summaries",
    {
      id: z.string().describe("Product ID"),
    },
    async ({ id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Get product ${id}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "delete-product",
    "Delete a product and all associated component analysis reports",
    {
      id: z.string().describe("Product ID to delete"),
    },
    async ({ id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Delete product ${id}`,
          },
        },
      ],
    })
  );

  server.prompt(
    "health-check",
    "Check if the ExploitIQ service is healthy",
    {},
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: "Check if ExploitIQ is healthy",
          },
        },
      ],
    })
  );
}