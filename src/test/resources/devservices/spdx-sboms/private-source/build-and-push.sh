#!/usr/bin/env bash
# Create a private GitHub repo, build a container image with source labels pointing to it,
# push to ghcr.io, and write an SPDX file referencing that image for upload-spdx-with-credentials tests.
#
# Prereqs: gh CLI (logged in), podman
# Usage: ./build-and-push.sh [REPO_NAME] [IMAGE_NAME]
#   REPO_NAME   default: spdx-private-source-test
#   IMAGE_NAME  default: spdx-private-source-test (used as ghcr.io/OWNER/IMAGE_NAME)

set -e

REPO_NAME="${1:-spdx-private-source-test}"
IMAGE_NAME="${2:-spdx-private-source-test}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve GitHub owner (user or org)
if ! OWNER="$(gh api user -q .login 2>/dev/null)"; then
  echo "Error: gh CLI not logged in. Run: gh auth login"
  exit 1
fi

GITHUB_REPO_URL="https://github.com/${OWNER}/${REPO_NAME}"
COMMIT_ID="${COMMIT_ID:-main}"
IMAGE_FULL="ghcr.io/${OWNER}/${IMAGE_NAME}:latest"

# Create private repo if it doesn't exist
if ! gh repo view "${OWNER}/${REPO_NAME}" &>/dev/null; then
  echo "Creating private repo ${OWNER}/${REPO_NAME}..."
  gh repo create "${REPO_NAME}" --private --description "Fixture for SPDX upload with credentials test"
else
  echo "Repo ${OWNER}/${REPO_NAME} already exists."
fi

# Build image with labels pointing to the private repo
echo "Building image with podman (source=${GITHUB_REPO_URL}, revision=${COMMIT_ID})..."
podman build \
  --build-arg "GITHUB_REPO_URL=${GITHUB_REPO_URL}" \
  --build-arg "COMMIT_ID=${COMMIT_ID}" \
  -t "${IMAGE_FULL}" \
  -f "${SCRIPT_DIR}/Dockerfile" \
  "${SCRIPT_DIR}"

# Login to ghcr.io using gh token (so push works)
echo "Logging in to ghcr.io..."
echo "$(gh auth token)" | podman login ghcr.io -u "${OWNER}" --password-stdin

# Push and get digest (stream output so you see progress and any errors)
echo "Pushing ${IMAGE_FULL}..."
PUSH_LOG=$(mktemp)
trap 'rm -f "${PUSH_LOG}"' EXIT
if ! podman push "${IMAGE_FULL}" 2>&1 | tee "${PUSH_LOG}"; then
  echo "Error: podman push failed. Check ghcr.io login (gh auth token) and image name."
  exit 1
fi
DIGEST=$(sed -n 's/.*Digest: \(sha256:[a-f0-9]*\).*/\1/p' "${PUSH_LOG}")
if [[ -z "${DIGEST}" ]]; then
  DIGEST=$(podman image inspect "${IMAGE_FULL}" --format '{{.Digest}}')
fi
if [[ -z "${DIGEST}" ]]; then
  DIGEST=$(podman image inspect "${IMAGE_FULL}" --format '{{index .RepoDigests 0}}' | cut -d'@' -f2)
fi
if [[ -z "${DIGEST}" ]]; then
  echo "Warning: could not get digest from push output or image inspect."
  exit 1
fi

echo "Image digest: ${DIGEST}"

# Write SPDX file (one product, one component pointing to our image)
# Component purl must be pkg:oci/name@sha256:xxx?repository_url=...&tag=...
# Backend parseImageFromPurl expects repository_url and @sha256:
REPOSITORY_URL="ghcr.io/${OWNER}/${IMAGE_NAME}"
# PURL: name after oci/ is the image name (no registry)
PURL="pkg:oci/${IMAGE_NAME}@${DIGEST}?repository_url=${REPOSITORY_URL}&tag=latest"
# Escape for JSON: no escaping needed if we use jq; otherwise be careful with &
PURL_ESC="${PURL}"

SPDX_FILE="${SCRIPT_DIR}/spdx-with-private-source.json"
# Use a product SPDXID that looks like the real format (hash-based) for consistency
PRODUCT_SPDXID="SPDXRef-product-private-source-test"
COMPONENT_SPDXID="SPDXRef-component-private-source-test"

cat > "${SPDX_FILE}" << SPDXEOF
{
  "SPDXID": "SPDXRef-DOCUMENT",
  "creationInfo": {
    "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "creators": ["Tool: build-and-push.sh"]
  },
  "dataLicense": "CC0-1.0",
  "name": "private-source-test",
  "spdxVersion": "SPDX-2.3",
  "documentNamespace": "https://github.com/${OWNER}/${REPO_NAME}/spdx/private-source",
  "packages": [
    {
      "SPDXID": "${PRODUCT_SPDXID}",
      "downloadLocation": "NOASSERTION",
      "externalRefs": [
        {
          "referenceCategory": "SECURITY",
          "referenceLocator": "cpe:/a:test:private-source-test:1.0",
          "referenceType": "cpe22Type"
        }
      ],
      "filesAnalyzed": false,
      "name": "private-source-test",
      "versionInfo": "1.0"
    },
    {
      "SPDXID": "${COMPONENT_SPDXID}",
      "downloadLocation": "NOASSERTION",
      "externalRefs": [
        {
          "referenceCategory": "PACKAGE_MANAGER",
          "referenceLocator": "${PURL_ESC}",
          "referenceType": "purl"
        }
      ],
      "filesAnalyzed": false,
      "name": "${IMAGE_NAME}",
      "versionInfo": "latest"
    }
  ],
  "relationships": [
    {
      "spdxElementId": "SPDXRef-DOCUMENT",
      "relatedSpdxElement": "${PRODUCT_SPDXID}",
      "relationshipType": "DESCRIBES"
    },
    {
      "spdxElementId": "${COMPONENT_SPDXID}",
      "relatedSpdxElement": "${PRODUCT_SPDXID}",
      "relationshipType": "PACKAGE_OF"
    }
  ]
}
SPDXEOF

echo "Wrote ${SPDX_FILE}"
echo ""
echo "Use this SPDX with upload-spdx and credentials (PAT for ${GITHUB_REPO_URL}):"
echo "  secretValue=<github_pat>  username=${OWNER}"
echo "  file=${SPDX_FILE}"
echo "  cveId=CVE-2024-0000"
