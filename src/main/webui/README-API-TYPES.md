# Generating TypeScript Types from OpenAPI

This project uses [openapi-typescript](https://openapi-ts.pages.dev/) to generate TypeScript types from the OpenAPI specification.

## Quick Start

### Option 1: Generate from Maven Build (Recommended - No Server Required)

This method uses static analysis of Java code during the Maven build process:

1. **Install dependencies** (if not already done):
   ```bash
   cd src/main/webui
   npm install
   ```

2. **Generate OpenAPI spec from Java code**:
   ```bash
   # From project root
   ./mvnw clean compile -DskipTests
   ```
   Or from the webui directory:
   ```bash
   npm run generate:openapi:maven
   ```
   
   This compiles your Java code. The OpenAPI spec will be generated in `target/generated/openapi/openapi.json` during the build and automatically copied to `src/main/webui/openapi.json`.
   
   **Note:** The OpenAPI spec generation happens during the Quarkus build process when it processes your REST endpoint annotations. The spec file is automatically copied to the webui directory via the Maven resources plugin.

3. **Generate TypeScript types**:
   ```bash
   cd src/main/webui
   npm run generate:types:file
   ```

   Or do both steps at once:
   ```bash
   cd src/main/webui
   npm run generate:all:maven
   ```

## Generate OpenAPI Spec File

### Method 1: From Maven Build (Static Analysis)

Generate the OpenAPI spec by analyzing Java code during the Maven build process:

```bash
# From project root
./mvnw clean compile -DskipTests
```

Or from the webui directory:

```bash
npm run generate:openapi:maven
```

This will:
- Compile your Java code with OpenAPI annotations
- Quarkus processes the annotations during build
- Generate the OpenAPI spec in `target/generated/openapi/openapi.json` (if `quarkus.smallrye-openapi.store-schema-directory` is configured)
- Automatically copy it to `src/main/webui/openapi.json` via Maven resources plugin

**Note:** The OpenAPI spec generation in Quarkus typically happens when the application context is initialized. For pure static analysis without any runtime, you may need to briefly start the application in test mode, or use the running server method below.

**Advantages:**
- ✅ Works in CI/CD pipelines
- ✅ No long-running server needed
- ✅ Can be integrated into build process

### Method 2: From Running Server

To save the OpenAPI specification from a running server:

```bash
npm run generate:openapi
```

This will:
- Fetch the OpenAPI spec from `http://localhost:8080/q/openapi`
- Save it as `openapi.json` in the `src/main/webui` directory
- Pretty-print the JSON for readability

### Custom Server URL

To fetch from a different server:

```bash
node scripts/fetch-openapi.js http://your-server:8080/q/openapi
```

### Generate Everything at Once

To generate both the OpenAPI spec file and TypeScript types:

```bash
npm run generate:all
```

This runs both `generate:openapi` and `generate:types:file` in sequence.

## Alternative Methods

### Generate Types from File

If you've already generated the `openapi.json` file:

```bash
npm run generate:types:file
```

This is faster than fetching from the server each time.

### Custom Server URL

For a different server URL or port:

```bash
npx openapi-typescript http://your-server:8080/q/openapi -o src/types/generated-api.ts
```

## Using Generated Types

The generated types will be in `src/types/generated-api.ts`. You can import and use them with your existing API client:

```typescript
import type { paths, components } from './types/generated-api';
import { apiGet } from '../services/apiClient';

// Example: Type-safe API call
type ReportsSummaryResponse = 
  paths['/api/reports/summary']['get']['responses']['200']['content']['application/json'];

export async function getReportsSummary(): Promise<ReportsSummaryResponse> {
  return apiGet<ReportsSummaryResponse>('/reports/summary');
}

// Example: Using component schemas
type Report = components['schemas']['Report'];
type Vulnerability = components['schemas']['Vulnerability'];
```

See `src/types/generated-api.example.ts` for more usage examples.

## Updating Types

Whenever the backend API changes, regenerate the types:

```bash
npm run generate:types
```

This ensures your TypeScript types stay in sync with the backend API.

## Notes

- **OpenAPI Spec File**: The `openapi.json` file can be committed to git for version control and to enable type generation without the server running
- **Generated Types**: The `generated-api.ts` file should be committed to git so it's available even when the server isn't running
- **Regeneration**: Regenerate both the spec file and types whenever you update the backend API endpoints or schemas
- **Integration**: The generated types work seamlessly with your existing `apiClient.ts` utilities

