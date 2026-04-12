#!/usr/bin/env node
/**
 * Post-processor for openapi-typescript-codegen to add .js extensions to imports
 * This is required for ESM module resolution in Node.js
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function walkDir(dir, callback) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts')) {
      callback(filePath);
    }
  }
}

const generatedDir = 'src/generated';
let totalFixed = 0;

walkDir(generatedDir, (filePath) => {
  let content = readFileSync(filePath, 'utf8');
  let fixed = false;

  // Fix relative imports that don't end with .js
  // Match: from './xxx' or from '../xxx' but not from './xxx.js'
  const newContent = content.replace(
    /from ['"](\.\.[\/][^'"]+|\.\/[^'"]+)(?<!\.js)['"]/g,
    (match, path) => {
      fixed = true;
      return `from '${path}.js'`;
    }
  );

  if (fixed) {
    writeFileSync(filePath, newContent, 'utf8');
    totalFixed++;
  }
});

console.log(`Fixed ${totalFixed} files with ESM import extensions`);
