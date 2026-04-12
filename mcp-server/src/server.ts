import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHealthTools } from "./tools/health.js";
import { registerReportTools } from "./tools/reports.js";
import { registerProductTools } from "./tools/products.js";
import { registerAnalysisTools } from "./tools/analysis.js";
import { registerPrompts } from "./prompts/prompts.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "exploitiq",
    version: "1.0.0",
  });

  registerHealthTools(server);
  registerReportTools(server);
  registerProductTools(server);
  registerAnalysisTools(server);
  registerPrompts(server);

  return server;
}
