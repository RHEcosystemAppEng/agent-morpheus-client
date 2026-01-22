# Generating TypeScript Types from OpenAPI

This project uses [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen) to generate TypeScript client code from the OpenAPI specification.

## Quick Start

### Generate Everything at Once (Recommended)

To generate both the OpenAPI spec file and TypeScript client:

```bash
cd src/main/webui
npm run generate:all
```

This will:
1. Run Maven `package` phase to generate the OpenAPI spec from Java annotations
2. Copy the spec to `src/main/webui/openapi.json`
3. Generate the TypeScript client in `src/generated-client/`

### Step-by-Step

1. **Install dependencies** (if not already done):
   ```bash
   cd src/main/webui
   npm install
   ```

2. **Generate OpenAPI spec from Java code**:
   ```bash
   cd src/main/webui
   npm run generate:openapi
   ```
   
   Or from the project root:
   ```bash
   ./mvnw clean package -DskipTests
   cd src/main/webui
   npm run copy:openapi
   ```
   
   This runs the Maven `package` phase which:
   - Compiles your Java code with OpenAPI annotations
   - Quarkus processes the annotations and generates the OpenAPI spec
   - Saves the spec to `target/generated/openapi/openapi.json`
   - The `generate:openapi` script automatically copies it to `src/main/webui/openapi.json`
   
   **Important:** The OpenAPI spec is only generated during the `package` phase (not `compile`), as Quarkus needs to process the application context to generate the complete spec.

3. **Generate TypeScript client**:
   ```bash
   cd src/main/webui
   npm run generate:client
   ```
   
   This generates the TypeScript client code from `openapi.json` into `src/generated-client/`.

## Generate OpenAPI Spec File

### Method 1: From Maven Build (Recommended)

Generate the OpenAPI spec by analyzing Java code during the Maven build process:

```bash
# From project root
./mvnw clean package -DskipTests
```

Or from the webui directory:

```bash
npm run generate:openapi
```

This will:
- Compile your Java code with OpenAPI annotations
- Run the Quarkus build process which processes the annotations
- Generate the OpenAPI spec in `target/generated/openapi/openapi.json` (configured via `quarkus.smallrye-openapi.store-schema-directory`)
- Automatically copy it to `src/main/webui/openapi.json` via the npm `copy:openapi` script

**Important Notes:**
- The OpenAPI spec generation happens during the **`package` phase**, not `compile`
- Quarkus needs to process the application context to generate the complete spec
- The copy step is handled by npm scripts (not Maven), keeping frontend build concerns separate from backend

**Advantages:**
- ✅ Works in CI/CD pipelines
- ✅ No long-running server needed
- ✅ Can be integrated into build process
- ✅ Generates complete spec with all endpoints and schemas


### Using the Generated Client

The generated client provides type-safe API calls. Import and use it like this:

```typescript
import { ReportEndpointService, ProductSummary } from '../generated-client';
import { useApi } from '../hooks/useApi';

// In a React component
const { data: productSummaries } = useApi<Array<ProductSummary>>(() =>
  ReportEndpointService.getApiReportsProduct()
);
```

The generated client includes:
- **Type-safe models**: All Java model classes are converted to TypeScript types
- **Service classes**: One service class per REST endpoint
- **Full type safety**: Request/response types are fully typed
- **Cancelable promises**: Support for request cancellation

## Available NPM Scripts

- `npm run generate:openapi` - Generates OpenAPI spec from Java code (runs Maven package) and copies it to webui directory
- `npm run copy:openapi` - Copies the OpenAPI spec from `target/generated/openapi/openapi.json` to `openapi.json` (standalone script)
- `npm run generate:client` - Generates TypeScript client from `openapi.json`
- `npm run generate:all` - Runs all steps in sequence: generate spec, copy it, and generate client (recommended)

## Updating Types

Whenever you change backend API endpoints or model classes:

1. **Update your Java code** with new endpoints/models
2. **Regenerate the OpenAPI spec**:
   ```bash
   npm run generate:openapi
   ```
3. **Regenerate the TypeScript client**:
   ```bash
   npm run generate:client
   ```
   
   Or do both at once:
   ```bash
   npm run generate:all
   ```

This ensures your TypeScript types stay in sync with the backend API.

## Notes

- **OpenAPI Spec File**: The `openapi.json` file should be committed to git for version control and to enable client generation without running Maven
- **Generated Client**: The `src/generated-client/` directory should be committed to git so it's available even when the server isn't running
- **Regeneration**: Regenerate both the spec file and client whenever you update the backend API endpoints or model schemas
- **Integration**: The generated client works seamlessly with the `useApi` hook (`src/hooks/useApi.ts`) for React components
- **Build Process**: The OpenAPI spec is automatically generated during `mvn package`, so it's always up-to-date in CI/CD pipelines

