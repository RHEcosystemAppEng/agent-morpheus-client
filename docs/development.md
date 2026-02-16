# Development

## Configuration

To see all the configuration options check the [configuration](./configuration.md) guide.

For authentication setup (Keycloak, external identity providers, testing), see the [authentication](./authentication.md) guide.

## Running the application in dev mode

### Integrated Mode (Default)

You can run your application in dev mode that enables live coding using:

```shell
./mvnw quarkus:dev -Dquarkus.rest-client.morpheus.url=https://agent-morpheus-route.com/scan
```

By default, this runs with **authentication disabled**. To enable Keycloak DevServices and OIDC:

```shell
./mvnw quarkus:dev -Dquarkus.oidc.enabled=true -Dquarkus.keycloak.devservices.enabled=true
```

This runs both the backend and frontend together, with the UI served through Quarkus at `http://localhost:8080`.

### Standalone Frontend Development

For faster frontend development cycles, you can run the UI standalone (without Quarkus). This is useful when you want to iterate quickly on frontend changes without restarting the Quarkus backend.

**Required Environment Variables:**

- `VITE_STANDALONE`: Set to `true` to enable standalone mode (automatically set by `dev:standalone` script)
- `VITE_API_BASE_URL`: Backend API base URL. **Required.** Must be a valid URL (e.g., `http://localhost:8080` or `https://api.example.com`)
- `API_TOKEN`: Authentication token for API requests. **Required.** The token will be automatically added to all API requests via the `Authorization: Bearer <token>` header.

**How to run:**
```shell script
cd src/main/webui
VITE_API_BASE_URL=http://localhost:8080 API_TOKEN=your-token-here npm run dev:standalone
```

This will:
- Start Vite dev server on `http://localhost:3000`
- Serve the UI at the root path 
- Proxy all `/api/*` requests to the backend URL specified in `VITE_API_BASE_URL` with automatic authentication

**Using environment file (.env):**
You can also create a `.env` file in `src/main/webui/`:
```bash
VITE_API_BASE_URL=http://localhost:8080
API_TOKEN=your-token-here
```

Then run:
```shell script
cd src/main/webui
npm run dev:standalone
```

## Supplying application data

You can supply the application with data by sending Agent Morpheus output.json files from your local file system to the application using:

```shell
 curl -i -X POST --header 'Content-type: application/json' http://localhost:8080/api/v1/reports -d @/path/to/file.json
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at <http://localhost:8080/q/dev/>.

## Packaging and running the application

The application can be packaged using:

```shell
./mvnw package
```

It produces the `quarkus-run.jar` file in the `target/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `target/quarkus-app/lib/` directory.

The application is now runnable using `java -jar target/quarkus-app/quarkus-run.jar`.

If you want to build an _über-jar_, execute the following command:

```shell
./mvnw package -Dquarkus.package.jar.type=uber-jar
```

The application, packaged as an _über-jar_, is now runnable using `java -jar target/*-runner.jar`.

## Creating a native executable

You can create a native executable using:

```shell
./mvnw package -Dnative
```

### Build profiles

> **Warning**: Quarkus has build-time properties that are fixed at compile time. If you change
> build-time properties in `application.properties` for a custom profile (e.g., `%external-idp`),
> you must build with that profile to apply them. Runtime properties can be overridden via
> `QUARKUS_PROFILE` env var at startup.

To build with a specific profile:

```shell
./mvnw package -Dnative -Dquarkus.profile=external-idp
```

Or using container build:

```shell
# podman
podman build --build-arg QUARKUS_PROFILE=external-idp -f src/main/docker/Dockerfile.multi-stage .

# docker
docker build --build-arg QUARKUS_PROFILE=external-idp -f src/main/docker/Dockerfile.multi-stage .
```

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./target/agent-morpheus-client-1.0.0-SNAPSHOT-runner`

### Building with profiles

Some Quarkus properties are **build-time only** and cannot be changed at runtime. When building for a specific deployment target, include the profile:

```shell
# For external-idp deployments (Keycloak, Google, etc.)
./mvnw package -Dnative -Dquarkus.profile=external-idp

# For prod deployments (OpenShift OAuth) - default
./mvnw package -Dnative
```

**Important:** The CI/CD pipeline builds a universal image without a specific profile. Runtime profile selection via `QUARKUS_PROFILE` works for most configurations, but build-time properties (like `@IfBuildProfile` annotations) are fixed at compile time.

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/maven-tooling>.

## Related Guides

- Quinoa ([guide](https://quarkiverse.github.io/quarkiverse-docs/quarkus-quinoa/dev/index.html)): Develop, build, and serve your npm-compatible web applications such as React, Angular, Vue, Lit, Svelte, Astro, SolidJS, and others alongside Quarkus.

## Provided Code

### Quinoa

Quinoa codestart added a tiny Vite app in src/main/webui.

[Related guide section...](https://quarkiverse.github.io/quarkiverse-docs/quarkus-quinoa/dev/index.html)
