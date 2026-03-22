# Minimal image with OCI labels pointing to a private GitHub repo.
# Used to test upload-spdx with credentials (PAT) for private repository access.
# Build with: podman build --build-arg GITHUB_REPO_URL=https://github.com/OWNER/REPO --build-arg COMMIT_ID=main -t IMAGE .
FROM alpine:3.18
ARG GITHUB_REPO_URL
ARG COMMIT_ID=main
# OCI labels that syft will emit as CycloneDX metadata.properties; ReportService reads these for source_info.
LABEL org.opencontainers.image.source="${GITHUB_REPO_URL}"
LABEL org.opencontainers.image.revision="${COMMIT_ID}"
