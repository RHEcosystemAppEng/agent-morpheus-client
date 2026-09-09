# JDK 21 + Syft for Tekton maven-test and local CI.
# Syft installation mirrors src/main/docker/Dockerfile.multi-stage (mandrel stage + COPY /tmp/syft).
# Build (repo root): docker build -f src/test/docker/Dockerfile -t quay.io/ecosystem-appeng/exploit-iq-test-image:latest src/test/docker
#
# Why mandrel for syft only: unpacking the Syft .tar.gz needs gzip; ubi10/openjdk-21
# slim variants may not ship gzip, which causes "tar (child): gzip: Cannot exec".
# Uses the same mandrel-25-rhel9 image (and digest) as Dockerfile.multi-stage so the
# syft-install infra matches the shipped image exactly.
FROM registry.redhat.io/quarkus/mandrel-25-rhel9@sha256:b19bdb7a74ed8827d5bc97dd95386da862a57571f7e8c2b77347912fdc0578f3 AS syft
USER 0
# Pin Syft with checksum verification (APPENG-5702 / T-041) — keep in sync with Dockerfile.multi-stage
ARG SYFT_VERSION=1.46.0
ARG SYFT_SHA256=d654f678b709eb53c393d38519d5ed7d2e57205529404018614cfefa0fb2b5ca
RUN curl -sSfL "https://github.com/anchore/syft/releases/download/v${SYFT_VERSION}/syft_${SYFT_VERSION}_linux_amd64.tar.gz" -o /tmp/syft.tar.gz \
  && echo "${SYFT_SHA256}  /tmp/syft.tar.gz" | sha256sum -c - \
  && tar -xzf /tmp/syft.tar.gz -C /tmp syft \
  && rm /tmp/syft.tar.gz

FROM registry.redhat.io/ubi10/openjdk-21:1788150970

LABEL org.opencontainers.image.title="exploit-iq-client-test-image"
LABEL org.opencontainers.image.description="UBI OpenJDK 21 with pinned Syft (same install as Dockerfile.multi-stage)"
LABEL app="exploit-iq"
LABEL component="exploit-iq-client"

USER 0
COPY --from=syft /tmp/syft /usr/local/bin/syft
RUN chmod +x /usr/local/bin/syft

USER 1001
