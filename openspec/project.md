# Project Context

## Purpose
ExploitIQ Client is a Quarkus + React web application that interacts with the ExploitIQ (Agent Morpheus) service to evaluate vulnerabilities on Software Bill of Materials (SBOMs). The application allows users to:
- Submit CycloneDX SBOMs and CVEs for vulnerability analysis
- Manage and view vulnerability analysis reports
- Track products and components across multiple reports
- Add metadata and user comments to reports
- Manage vulnerability intelligence data

The application serves as a client interface for the Agent Morpheus vulnerability analysis service, providing request queuing, report management, and a web-based UI for interacting with analysis results.

## Tech Stack

### Backend
- **Framework**: Quarkus 3.29.4
- **Language**: Java 21
- **Database**: MongoDB (via Quarkus Panache)
- **API**: REST (JAX-RS), OpenAPI/Swagger
- **Authentication**: OIDC/OAuth2 (OpenShift integration)
- **Observability**: Micrometer/Prometheus, OpenTelemetry
- **Build**: Maven

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript (strict mode)
- **UI Library**: PatternFly 6
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Integration**: Quinoa (Quarkus frontend integration)

### Infrastructure
- **WebSockets**: For real-time notifications
- **API Client Generation**: OpenAPI TypeScript Codegen
- **Container**: Docker (multiple Dockerfile variants available)

## Project Conventions

### Code Style

#### Java
- Package structure: `com.redhat.ecosystemappeng.morpheus`
- Standard Java naming conventions (PascalCase for classes, camelCase for methods/variables)
- REST endpoints in `rest/` package
- Service layer in `service/` package
- Model classes in `model/` package
- Use Jakarta EE annotations (Jakarta REST, CDI)
- OpenAPI annotations for API documentation

#### TypeScript/React
- Strict TypeScript configuration (no `any` types allowed)
- Functional components with hooks only
- PascalCase for components, camelCase for functions/variables
- Components MUST NOT exceed 50 lines of code (refactor into sub-components if needed)
- Prefer PatternFly components over native HTML tags (`div`, `p`, `span`)
- All API calls MUST use the generated OpenAPI client via `useApi` hook
- File organization:
  - Components: `src/components/`
  - Pages: `src/pages/`
  - Hooks: `src/hooks/`
  - Generated client: `src/generated-client/`

### Architecture Patterns

#### Backend-Frontend Separation
- **Business logic**: All business logic, data persistence, and API contracts MUST be in the Java backend
- **Frontend role**: Presentation layer only - consumes REST APIs
- **Independence**: Backend services MUST be independently deployable without frontend
- **API-First**: All communication via REST APIs documented with OpenAPI

#### Code Organization
- Backend: `src/main/java/com/redhat/ecosystemappeng/morpheus/`
  - `rest/` - REST endpoints
  - `service/` - Business logic services
  - `model/` - Data models
  - `client/` - External service clients
  - `metrics/` - Metrics and observability
  - `tracing/` - Distributed tracing
- Frontend: `src/main/webui/`
  - `src/` - React/TypeScript source
  - `src/generated-client/` - Auto-generated OpenAPI client
  - `src/hooks/` - React hooks (use `useApi` for API calls)
- Configuration: `src/main/resources/application.properties`

#### API Design
- RESTful conventions
- OpenAPI documentation (generated from Java annotations)
- Type-safe API client (auto-generated from OpenAPI spec)
- Error handling with user-friendly messages
- API versioning considered for breaking changes

#### Frontend Architecture
- All API calls use `useApi` hook with generated client services
- No direct fetch/axios calls in components
- Generated client provides full type safety
- Components are small, focused, and reusable

### Testing Strategy
- **Backend**: JUnit5 (included in dependencies, test structure to be established)
- **Frontend**: TypeScript compilation must pass without errors
- **Integration**: Maven Failsafe plugin for integration tests
- **Quality Gates**: 
  - TypeScript MUST compile without errors
  - Java code MUST compile and pass linting
  - No test files currently present in codebase

### Git Workflow
- Branching strategy: Not explicitly documented (currently on `homepage` branch)
- Commit conventions: Not explicitly documented
- OpenSpec workflow: Use OpenSpec for change proposals and specifications

## Domain Context

### Core Concepts

#### SBOM (Software Bill of Materials)
- CycloneDX format SBOMs are submitted for analysis
- Contains component and dependency information
- Used to identify vulnerable components

#### CVE (Common Vulnerabilities and Exposures)
- List of CVEs can be submitted with SBOM for targeted analysis
- Each CVE is analyzed against the SBOM components
- Results include justification labels and checklists

#### Reports
- Represent a vulnerability analysis request and its results
- States: `Completed`, `Sent`, `Queued`, `Failed`
- Include metadata (batch_id, user, custom key-value pairs)
- Contain justification labels and analysis results
- Can be retried or deleted

#### Justification Labels
Standard labels used to categorize vulnerability analysis results:
- `false_positive`, `code_not_present`, `code_not_reachable`
- `requires_configuration`, `requires_dependency`, `requires_environment`
- `protected_by_compiler`, `protected_at_runtime`, `protected_at_perimeter`
- `protected_by_mitigating_control`, `uncertain`, `vulnerable`

#### Products
- Represent container images or software products
- Tracked across multiple reports
- Include image name, tag, and source location information

#### Request Queue
- Configurable pool of concurrent requests (default: 20)
- Requests queued when pool is full
- Timeout mechanism (default: 2 hours) for expired requests

#### Vulnerabilities
- Additional vulnerability intelligence data
- Can be used as an Intel Source for Morpheus
- Include free-text descriptions and metadata

### Key Workflows
1. **Request Submission**: User submits SBOM + CVEs → Request queued → Sent to Morpheus → Callback received → Report completed
2. **Report Management**: View, filter, sort, retry, delete reports
3. **Product Tracking**: Reports grouped by product/image for analysis
4. **Metadata Management**: Add custom metadata including git source location and commit ID

## Important Constraints

### Technical Constraints
- **Frontend location**: UI MUST be under `src/main/webui` (Quinoa requirement)
- **Component size**: React components MUST NOT exceed 50 lines
- **Type safety**: No `any` types in TypeScript, strict mode required
- **API calls**: MUST use generated OpenAPI client via `useApi` hook
- **UI components**: Prefer PatternFly components over native HTML
- **Backend independence**: Backend MUST be deployable without frontend
- **Java version**: Java 21 required
- **Request size**: Max 1GB body size for requests

### Business Constraints
- Authentication required for all endpoints (OIDC/OAuth2)
- Management endpoints (health, metrics) accessible without auth
- Production: Swagger UI disabled by default (controlled by `INCLUDE_SWAGGER_UI` build property)
- Queue limits: Configurable max concurrent requests and timeout

### Deployment Constraints
- OpenShift/Kubernetes deployment
- MongoDB required for persistence
- OAuth2 integration with OpenShift OAuth server
- Native image builds supported via GraalVM

## External Dependencies

### Services
- **Agent Morpheus/ExploitIQ Service**: Primary vulnerability analysis service
  - Endpoint: Configurable via `quarkus.rest-client.morpheus.url`
  - Handles SBOM analysis and CVE evaluation
  - Sends callback responses with analysis results

- **GitHub API**: For fetching repository information
  - Endpoint: `https://api.github.com`
  - Used for component and language detection

- **Component Syncer Service**: For component synchronization
  - Endpoint: Configurable via `quarkus.rest-client.component-syncer.url`
  - Knative eventing integration

- **Feedback API**: For user feedback collection
  - Endpoint: Configurable via `quarkus.rest-client.feedback-api.url`
  - Used for collecting user comments and feedback

### Infrastructure
- **MongoDB**: Primary data store for reports, products, vulnerabilities
  - Database: `agent-morpheus-client` (configurable)
  - Uses Quarkus Panache for data access

- **OpenShift OAuth**: Authentication and authorization
  - OAuth2/OIDC hybrid mode
  - User info endpoint integration
  - JWKS for token validation

### Development Tools
- **WireMock**: For local development and testing
  - Mock external services in dev mode
  - Configurable via devservices

- **Quinoa**: Quarkus extension for frontend integration
  - Manages frontend build and serving
  - Live reload in dev mode
