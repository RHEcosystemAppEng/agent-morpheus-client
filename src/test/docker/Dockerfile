# JDK 21 + Syft for Tekton maven-test and local CI.
# Syft installation mirrors src/main/docker/Dockerfile.multi-stage (mandrel stage + COPY /tmp/syft).
# Build (repo root): docker build -f src/test/docker/Dockerfile -t quay.io/exploit-iq/agent-morpheus-client-test-image:latest src/test/docker
#
# Why mandrel for syft only: anchore install.sh unpacks a .tar.gz and needs gzip; ubi9/openjdk-21
# slim variants may not ship gzip, which causes "tar (child): gzip: Cannot exec".
FROM registry.redhat.io/quarkus/mandrel-for-jdk-21-rhel8:23.1 AS syft
USER 0
RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /tmp

FROM registry.redhat.io/ubi9/openjdk-21:latest

LABEL org.opencontainers.image.title="agent-morpheus-client-test-image"
LABEL org.opencontainers.image.description="UBI OpenJDK 21 with Syft (same install path as Dockerfile.multi-stage)"
LABEL app="exploit-iq"
LABEL component="exploit-iq-client"

USER 0
COPY --from=syft /tmp/syft /usr/local/bin/syft
RUN chmod +x /usr/local/bin/syft

USER 1001
