# Agent Morpheus - Client

This project is a Quarkus + React web application implemented to interact with Agent Morpheus service
for sending requests to evaluate vulnerabilities on specific SBOMs.

## Using the application

Open http://localhost:8080/app/index.html

In the _Request Analysis_ tab you will access a form where you can load a CycloneDX SBOM and type a list of CVEs to inspect.
The Request ID will be used to trace the request and will be generated from the SBOM data but can be updated before submitting the request.

The Programming Languages will be pre-populated using the repository information and are used to decide which file patterns to use when analysing
the repository for vulnerabilities. Add or remove depending on your needs.

After submitting the request you can go to the _View Reports_ tab where you can manage all the received reports.

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
./mvnw compile quarkus:dev
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at <http://localhost:8080/q/dev/>.

## Packaging and running the application

The application can be packaged using:

```shell script
./mvnw package
```

It produces the `quarkus-run.jar` file in the `target/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `target/quarkus-app/lib/` directory.

The application is now runnable using `java -jar target/quarkus-app/quarkus-run.jar`.

If you want to build an _über-jar_, execute the following command:

```shell script
./mvnw package -Dquarkus.package.jar.type=uber-jar
```

The application, packaged as an _über-jar_, is now runnable using `java -jar target/*-runner.jar`.

## Creating a native executable

You can create a native executable using:

```shell script
./mvnw package -Dnative
```

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell script
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./target/agent-morpheus-client-1.0.0-SNAPSHOT-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/maven-tooling>.

## Related Guides

- Quinoa ([guide](https://quarkiverse.github.io/quarkiverse-docs/quarkus-quinoa/dev/index.html)): Develop, build, and serve your npm-compatible web applications such as React, Angular, Vue, Lit, Svelte, Astro, SolidJS, and others alongside Quarkus.

## Provided Code

### Quinoa

Quinoa codestart added a tiny Vite app in src/main/webui. The page is configured to be visible on <a href="/app">/app</a>.

[Related guide section...](https://quarkiverse.github.io/quarkiverse-docs/quarkus-quinoa/dev/index.html)
