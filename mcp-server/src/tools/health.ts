import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OpenAPI } from "../generated/core/OpenAPI.js";

export function registerHealthTools(server: McpServer): void {
  server.tool(
    "health_check",
    "Check if the ExploitIQ service is up and responding",
    {},
    async () => {
      try {
        const response = await fetch(`${OpenAPI.BASE}/api/v1/health`, {
          headers: OpenAPI.TOKEN
            ? { Authorization: `Bearer ${OpenAPI.TOKEN}` }
            : {},
        });
        const body = await response.json();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Health check failed: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
