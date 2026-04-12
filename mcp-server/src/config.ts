import { readFileSync } from "fs";
import { OpenAPI } from "./generated/core/OpenAPI.js";

export interface Config {
  baseUrl: string;
  token?: string;
  mcpPort: number;
  tlsCert?: string;
  tlsKey?: string;
}

export function loadConfig(): Config {
  const config: Config = {
    baseUrl: process.env.EXPLOITIQ_BASE_URL ?? "http://localhost:8080",
    token: process.env.EXPLOITIQ_TOKEN,
    mcpPort: parseInt(process.env.EXPLOITIQ_MCP_PORT ?? "3000", 10),
    tlsCert: process.env.EXPLOITIQ_MCP_TLS_CERT,
    tlsKey: process.env.EXPLOITIQ_MCP_TLS_KEY,
  };

  OpenAPI.BASE = config.baseUrl;
  if (config.token) {
    OpenAPI.TOKEN = config.token;
  }

  return config;
}

export function getTlsOptions(config: Config): { cert: Buffer; key: Buffer } | undefined {
  if (config.tlsCert && config.tlsKey) {
    return {
      cert: readFileSync(config.tlsCert),
      key: readFileSync(config.tlsKey),
    };
  }
  return undefined;
}
