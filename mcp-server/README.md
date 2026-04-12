# ExploitIQ MCP Server

MCP server for the ExploitIQ/Agent Morpheus vulnerability analysis platform.
Enables Claude Code to submit analyses, manage reports, and view results.

## Setup

```bash
cd mcp-server
npm install
npm run generate-client
npm run build
```

## Usage

### Local (stdio)

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "exploitiq": {
      "command": "node",
      "args": ["/path/to/agent-morpheus-client/mcp-server/dist/index.js"],
      "env": {
        "EXPLOITIQ_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

Or via CLI:

```bash
claude mcp add exploitiq -- node /path/to/mcp-server/dist/index.js
```

### Remote (streamable-http)

Start the server:

```bash
EXPLOITIQ_BASE_URL=http://localhost:8080 node dist/http.js
```

Connect from Claude Code:

```bash
claude mcp add --transport streamable-http exploitiq http://localhost:3000/mcp
```

With authentication:

```bash
claude mcp add --transport streamable-http exploitiq \
  http://localhost:3000/mcp \
  --header "Authorization: Bearer <token>"
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPLOITIQ_BASE_URL` | Yes | `http://localhost:8080` | Client API URL |
| `EXPLOITIQ_TOKEN` | No | - | Bearer token for API auth |
| `EXPLOITIQ_MCP_PORT` | No | `3000` | HTTP port (remote mode) |
| `EXPLOITIQ_MCP_TLS_CERT` | No | - | TLS certificate path |
| `EXPLOITIQ_MCP_TLS_KEY` | No | - | TLS private key path |

## Available Tools

| Tool | Description |
|------|-------------|
| `health_check` | Check service health |
| `submit_analysis` | Submit single repo for CVE analysis |
| `upload_spdx_sbom` | Upload SPDX SBOM file |
| `upload_cyclonedx_sbom` | Upload CycloneDX SBOM file |
| `list_reports` | List reports with filtering |
| `get_report` | Get report by MongoDB ID |
| `get_report_by_scan_id` | Get report by scan ID |
| `delete_report` | Delete a report |
| `retry_analysis` | Retry failed analysis |
| `list_products` | List products |
| `get_product` | Get product details |
| `delete_product` | Delete a product |

## Regenerate Client

When the backend API changes:

```bash
# Export spec from running Quarkus server
cd .. && ./mvnw clean package -DskipTests -Dquarkus.quinoa.enabled=false
cp target/generated/openapi/openapi.json mcp-server/openapi.json

# Or copy from webui
cp src/main/webui/openapi.json mcp-server/openapi.json

# Regenerate and rebuild
cd mcp-server && npm run generate-client && npm run build
```
