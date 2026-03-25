# Tests

## Container runtime for local tests

Quarkus Dev Services (MongoDB, WireMock, and similar) talk to a **Docker-compatible** API. If you use **Podman** without the Docker daemon, enable Podman’s user socket and point clients at it so Dev Services behave like they would with Docker:

```shell
systemctl --user enable podman.socket --now
export DOCKER_HOST=unix://$(podman info --format '{{.Host.RemoteSocket.Path}}')
```

Then run `./mvnw test` (or your usual Maven test invocation). Without this, tests that start containers may fail locally.

## REST API tests (`@QuarkusTest` + REST Assured)

The package `com.redhat.ecosystemappeng.morpheus.rest` holds HTTP-level tests for the backend. They are **JUnit 5** classes annotated with **`@QuarkusTest`** and use **REST Assured** against the **in-process** Quarkus application (Mongo Dev Services, WireMock for outbound clients where configured, seeded data where enabled).

Run them with `./mvnw test` or a narrower `-Dtest=…`.

### Other helpers

- **`RestApiTestFixture.awaitSpdxProductProcessingComplete(productId)`** — SPDX uploads return `202` and finish work asynchronously; some tests wait until product + report counts line up before asserting.

For project-wide conventions (Surefire vs Failsafe, quality gates), see `openspec/project.md`.

---

## CI test pipeline image

The Tekton task **`.tekton/tekton-tasks/maven-test-ci.yaml`** runs **`./mvnw test`** inside **`quay.io/exploit-iq/agent-morpheus-client-test-image:latest`**. That image bundles **JDK 21** (UBI OpenJDK) and **Syft** on `PATH`, using the same Syft install approach as **`src/main/docker/Dockerfile.multi-stage`** (install on Mandrel builder, copy `/tmp/syft` into the runtime layer) so `install.sh` has `gzip`/`tar` available.

Pipelines expect that image tag to exist in Quay before `maven-test` can succeed.

### Build and push

From the **repository root** (requires access to `registry.redhat.io`; use `docker login` or `podman login` as appropriate):

```bash
docker build -f src/test/docker/Dockerfile \
  -t quay.io/exploit-iq/agent-morpheus-client-test-image:latest \
  src/test/docker

docker push quay.io/exploit-iq/agent-morpheus-client-test-image:latest
```

For pushes to a **private** registry, point **`DOCKER_CONFIG`** at a directory that contains **`config.json`** (see Docker documentation); that directory must be the config **folder**, not the file path.

The Dockerfile lives at **`src/test/docker/Dockerfile`**.
