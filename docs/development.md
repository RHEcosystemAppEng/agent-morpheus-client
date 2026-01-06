# Development

## Configuration

To see all the configuration options check the [configuration](./configuration.md) guide.

For authentication setup (Keycloak, external identity providers, testing), see the [authentication](./authentication.md) guide.

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell
quarkus dev -Dquarkus.rest-client.morpheus.url=https://agent-morpheus-route.com/scan  -Dquarkus.http.auth.permission.authenticated.policy=permit
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
