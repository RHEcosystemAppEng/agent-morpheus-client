# Development

## Configuration

To see all the configuration options check the [configuration](./configuration.md) README.

## Running the application in dev mode

### Integrated Mode (Default)

You can run your application in dev mode that enables live coding using:

```shell
quarkus dev -Dquarkus.rest-client.morpheus.url=https://agent-morpheus-route.com/scan  -Dquarkus.http.auth.permission.authenticated.policy=permit
```

This runs both the backend and frontend together, with the UI served through Quarkus at `http://localhost:8080`.

### Standalone Frontend Development

For faster frontend development cycles, you can run the UI standalone (without Quarkus):

```shell script
cd src/main/webui
npm run dev:standalone
```

This will:
- Start Vite dev server on `http://localhost:3000`
- Serve the UI at the root path 
- Connect to the Quarkus backend using the `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:8080`)

**Environment Variables:**
- `VITE_STANDALONE`: Set to `true` to enable standalone mode (automatically set by `dev:standalone` script)
- `VITE_API_BASE_URL`: Backend API base URL. Must be defined.

**Custom Backend URL Example:**
```shell script
cd src/main/webui
VITE_API_BASE_URL=https://exploit-iq-client.devcluster.openshit.com npm run dev:standalone
```

**API Configuration:**
- In standalone mode: API calls use relative paths that go through Vite's proxy server, which forwards requests to `VITE_API_BASE_URL`. This avoids CORS issues since the proxy makes server-to-server requests.
- In integrated mode: API calls use relative paths (same origin as the page)

**CORS Handling:**
When running in standalone mode, the Vite dev server automatically proxies all `/api/*` requests to your backend URL. This eliminates CORS issues because:
1. The browser makes requests to `http://localhost:3000/api/*` (same origin)
2. Vite proxy forwards these to your backend URL (server-to-server, no CORS)
3. The proxy handles all CORS headers automatically

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

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./target/agent-morpheus-client-1.0.0-SNAPSHOT-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/maven-tooling>.

## Related Guides

- Quinoa ([guide](https://quarkiverse.github.io/quarkiverse-docs/quarkus-quinoa/dev/index.html)): Develop, build, and serve your npm-compatible web applications such as React, Angular, Vue, Lit, Svelte, Astro, SolidJS, and others alongside Quarkus.

## Provided Code

### Quinoa

Quinoa codestart added a tiny Vite app in src/main/webui.

[Related guide section...](https://quarkiverse.github.io/quarkiverse-docs/quarkus-quinoa/dev/index.html)
