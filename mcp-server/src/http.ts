import express from "express";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig, getTlsOptions } from "./config.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = express();

  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST for MCP requests." },
      id: null,
    }));
  });

  app.delete("/mcp", async (req, res) => {
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    }));
  });

  const tlsOptions = getTlsOptions(config);
  const httpServer = tlsOptions
    ? createHttpsServer(tlsOptions, app)
    : createHttpServer(app);

  const protocol = tlsOptions ? "https" : "http";

  httpServer.listen(config.mcpPort, () => {
    console.log(`ExploitIQ MCP server listening on ${protocol}://0.0.0.0:${config.mcpPort}/mcp`);
    console.log(`Backend API: ${config.baseUrl}`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
