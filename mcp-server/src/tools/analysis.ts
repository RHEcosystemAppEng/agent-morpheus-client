import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { ReportEndpointService } from "../generated/services/ReportEndpointService.js";
import { ProductEndpointService } from "../generated/services/ProductEndpointService.js";

function formatResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data ?? null, null, 2) }] };
}

function formatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true as const };
}

export function registerAnalysisTools(server: McpServer): void {
  server.tool(
    "analyze_cve",
    "Analyze a CVE vulnerability against a source code repository to determine exploitability",
    {
      cveId: z.string().describe("CVE ID to analyze (e.g., CVE-2024-1234)"),
      sourceRepo: z.string().describe("Source repository URL"),
      commitId: z.string().describe("Commit ID or reference"),
      secretValue: z.string().optional().describe("Secret value for private repository access (PAT or SSH key)"),
      userName: z.string().optional().describe("Git username (required for PAT authentication)"),
    },
    async ({ cveId, sourceRepo, commitId, secretValue, userName }) => {
      try {
        const requestBody: any = {
          analysisType: "source",
          vulnerabilities: [cveId],
          sourceRepo,
          commitId,
          metadata: {},
        };

        if (secretValue) {
          requestBody.credential = {
            secretValue,
            userName,
          };
        }

        const data = await ReportEndpointService.postApiV1ReportsNew({ requestBody });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "analyze_spdx_sbom",
    "Analyze an SPDX SBOM file for CVE vulnerability exploitability",
    {
      filePath: z.string().describe("Path to the SPDX SBOM file"),
      cveId: z.string().optional().describe("CVE ID to analyze (optional)"),
      secretValue: z.string().optional().describe("Secret value for private repository access"),
      userName: z.string().optional().describe("Git username for private repository access"),
    },
    async ({ filePath, cveId, secretValue, userName }) => {
      try {
        const fileBuffer = readFileSync(filePath);
        const blob = new Blob([fileBuffer]);

        const formData: any = {
          file: blob,
        };

        if (cveId) {
          formData.cveId = cveId;
        }
        if (secretValue) {
          formData.secretValue = secretValue;
        }
        if (userName) {
          formData.userName = userName;
        }

        const data = await ProductEndpointService.postApiV1ProductsUploadSpdx({ formData });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    "analyze_cyclonedx_sbom",
    "Analyze a CycloneDX SBOM file for CVE vulnerability exploitability",
    {
      filePath: z.string().describe("Path to the CycloneDX SBOM file"),
      cveId: z.string().optional().describe("CVE ID to analyze (optional)"),
      secretValue: z.string().optional().describe("Secret value for private repository access"),
      userName: z.string().optional().describe("Git username for private repository access"),
    },
    async ({ filePath, cveId, secretValue, userName }) => {
      try {
        const fileBuffer = readFileSync(filePath);
        const blob = new Blob([fileBuffer]);

        const formData: any = {
          file: blob,
        };

        if (cveId) {
          formData.cveId = cveId;
        }
        if (secretValue) {
          formData.secretValue = secretValue;
        }
        if (userName) {
          formData.userName = userName;
        }

        const data = await ProductEndpointService.postApiV1ProductsUploadCyclonedx({ formData });
        return formatResult(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
