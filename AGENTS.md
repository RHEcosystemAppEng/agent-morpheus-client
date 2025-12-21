<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Core Principles

### I. Business Logic in Backend
All business logic, data persistence, and API contracts MUST be implemented in the Java backend. The frontend is a presentation layer that consumes backend REST APIs. Backend services MUST be independently deployable without the frontend.

### II. Integrated Frontend Location
The UI MUST be located under `src/main/webui` and integrated with Quarkus via Quinoa. The frontend MUST be served through the Quarkus application, ensuring a unified deployment model. Frontend build artifacts are managed by Quinoa during the Quarkus build process.

### III. Type-Safe Technology Stack
Frontend MUST use TypeScript (not JavaScript) for all source files. Backend MUST use Java with strong typing. Type safety is non-negotiable: all API contracts between frontend and backend MUST be explicitly typed and validated. Avoid `any` types in TypeScript; use proper interfaces and types.

### IV. Modern UI Framework Standards
Frontend MUST use React 18+ with functional components and hooks. UI components MUST use PatternFly 6 design system for consistency and accessibility. Build tooling MUST use Vite for fast development and optimized production builds. All UI components MUST be responsive and accessible. Native HTML tags like `div`, `p`, and `span` should be avoided when possible in favor of patternfly components. Usually text can be directly embedded in the components instead of wrapped in html tags.

### V. API-First Design
All frontend-backend communication MUST go through REST APIs. APIs MUST be documented (OpenAPI/Swagger). Backend endpoints MUST follow RESTful conventions. API versioning MUST be considered for breaking changes. Frontend MUST handle API errors gracefully with user-friendly messages. All API calls MUST use the generated OpenAPI client (`src/services/generated-client/client`) with the generic `useApi` hook (`src/hooks/useApi`). Components MUST NOT make direct API calls; they MUST use `useApi` with the generated client services for data fetching and state management. The generated client is automatically maintained from the OpenAPI specification and provides full type safety.

### VI. Complex Data Processing
When there is complex logic required to extract or transform frontend data from backend API responses, this logic MUST be encapsulated in a custom hook. The hook MUST call the backend API (using `useApi` with the generated client) and MUST include a separate, pure function that performs the data transformation logic. The hook MUST return the processed data. This separation ensures testability, reusability, and maintainability of data transformation logic while keeping components focused on presentation.

### VII. Accessible Typography and Layout Units
Font sizes and layout dimensions (heights, widths, padding, margins) that affect text readability MUST use `rem` units instead of `px` units. This ensures the UI scales properly when users adjust their browser's font size settings, which is critical for accessibility. Use `rem` for font sizes, line heights, and any layout dimensions (div heights, padding, margins) that should scale with user font preferences. Pixel units (`px`) may only be used for non-text elements like borders, shadows, or fixed-size icons that should not scale with font size changes.

### VIII. Loading State Patterns
Loading states MUST use PatternFly `Skeleton` components instead of `Spinner` components. Skeletons provide better UX by showing the structure and layout of content that will appear, reducing perceived load time and layout shift. Use `Skeleton` components to match the shape and size of the content being loaded. Spinners should only be used for small, inline loading indicators (e.g., button loading states) or when skeleton placeholders are not practical.


## Technology Stack

**Backend**: Quarkus, Java, MongoDB (via Panache), REST
**Frontend**: React 18+, TypeScript, Vite, PatternFly 6  
**Build**: Maven (backend), Vite/Quinoa (frontend integration)  

## Development Workflow

### Code Organization
- Backend Java code: `src/main/java/com/redhat/ecosystemappeng/morpheus/`
- Frontend TypeScript/React code: `src/main/webui`
- Generated API client: `src/main/webui/src/services/generated-client/` (auto-generated from OpenAPI)
- React hooks: `src/main/webui/src/hooks/` (use `useApi` for all API calls)
- API contracts: Documented in OpenAPI, shared types via TypeScript interfaces
- Configuration: `src/main/resources/application.properties`

### Quality Gates
- TypeScript MUST compile without errors
- Java code MUST compile and pass linting

### Development Mode
- Backend and Frontend: `quarkus dev` (enables live reload)
- Access: `http://localhost:8080`
    
Use `docs/development.md` for runtime development guidance.

