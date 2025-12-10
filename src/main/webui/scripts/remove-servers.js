#!/usr/bin/env node

/**
 * Removes the 'servers' field from OpenAPI spec to allow frontend to use relative URLs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = process.argv[2] || resolve(__dirname, '../../../target/generated/openapi/openapi.json');
const outputPath = process.argv[3] || resolve(__dirname, '../openapi.json');

try {
  const spec = JSON.parse(readFileSync(inputPath, 'utf8'));
  
  // Set servers to empty array instead of removing it
  // This ensures the generated client uses an empty BASE URL
  spec.servers = [];
  
  writeFileSync(outputPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
  console.log(`✓ Set servers to empty array in OpenAPI spec`);
  console.log(`  Input:  ${inputPath}`);
  console.log(`  Output: ${outputPath}`);
} catch (error) {
  console.error(`Error processing OpenAPI spec: ${error.message}`);
  process.exit(1);
}

