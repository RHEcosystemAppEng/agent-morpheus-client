import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProductEndpointService } from "../generated/services/ProductEndpointService.js";
import { ReportEndpointService } from "../generated/services/ReportEndpointService.js";

function formatResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function formatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true as const };
}

export function registerProductTools(server: McpServer): void {
  server.tool(
    "list_products",
    "List all product data with optional filtering and sorting",
    {
      page: z.number().optional().describe("Page number (0-based)"),
      pageSize: z.number().optional().describe("Number of items per page"),
      sortField: z.string().optional().describe("Field to sort by"),
      sortDirection: z.string().optional().describe("Sort direction: ASC or DESC"),
      name: z.string().optional().describe("Filter by product name"),
      cveId: z.string().optional().describe("Filter by CVE ID"),
    },
    async ({ page, pageSize, sortField, sortDirection, name, cveId }) => {
      try {
        const data = await ProductEndpointService.getApiV1Products({
          page,
          pageSize,
          sortField,
          sortDirection,
          name,
          cveId,
        });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "get_product",
    "Get product data by ID including report summaries",
    {
      id: z.string().describe("Product ID"),
    },
    async ({ id }) => {
      try {
        const data = await ReportEndpointService.getApiV1ReportsProduct1({ id });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "delete_product",
    "Delete a product and all associated component analysis reports",
    {
      id: z.string().describe("Product ID to delete"),
    },
    async ({ id }) => {
      try {
        const data = await ProductEndpointService.deleteApiV1Products({ id });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
