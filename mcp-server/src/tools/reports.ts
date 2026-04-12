import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ReportEndpointService } from "../generated/services/ReportEndpointService.js";

function formatResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function formatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true as const };
}

export function registerReportTools(server: McpServer): void {
  server.tool(
    "list_reports",
    "List analysis reports with optional filtering and sorting",
    {
      page: z.number().optional().describe("Page number (0-based)"),
      pageSize: z.number().optional().describe("Number of items per page"),
      sortBy: z.array(z.string()).optional().describe("Sort criteria in format 'field:direction'"),
      vulnId: z.string().optional().describe("Filter by vulnerability ID (CVE ID)"),
      imageName: z.string().optional().describe("Filter by image name"),
      status: z.string().optional().describe("Filter by status: completed, sent, failed, queued, expired, pending"),
      exploitIqStatus: z.string().optional().describe("Filter by ExploitIQ status: TRUE, FALSE, UNKNOWN"),
      withoutProduct: z.string().optional().describe("When true, return only reports without metadata.product_id"),
    },
    async ({ page, pageSize, sortBy, vulnId, imageName, status, exploitIqStatus, withoutProduct }) => {
      try {
        const data = await ReportEndpointService.getApiV1Reports({
          page,
          pageSize,
          sortBy,
          vulnId,
          imageName,
          status,
          exploitIqStatus,
          withoutProduct,
        });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "get_report",
    "Get a specific analysis report by ID",
    {
      id: z.string().describe("Report ID (24-character hexadecimal MongoDB ObjectId format)"),
    },
    async ({ id }) => {
      try {
        const data = await ReportEndpointService.getApiV1Reports1({ id });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "get_report_by_scan_id",
    "Get a report by its scan ID (input.scan.id)",
    {
      scanId: z.string().describe("Scan ID of the report"),
    },
    async ({ scanId }) => {
      try {
        const data = await ReportEndpointService.getApiV1ReportsByScanId({ scanId });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "delete_report",
    "Delete a specific analysis report by ID",
    {
      id: z.string().describe("Report ID to delete (24-character hexadecimal MongoDB ObjectId format)"),
    },
    async ({ id }) => {
      try {
        const data = await ReportEndpointService.deleteApiV1Reports1({ id });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "retry_analysis",
    "Retry an existing analysis request by ID",
    {
      id: z.string().describe("Report ID to retry (24-character hexadecimal MongoDB ObjectId format)"),
    },
    async ({ id }) => {
      try {
        const data = await ReportEndpointService.postApiV1ReportsRetry({ id });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
