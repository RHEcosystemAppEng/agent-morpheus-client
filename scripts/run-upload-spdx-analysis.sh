#!/usr/bin/env bash
# ==============================================================================
# Trigger SPDX multi-component analysis via the Morpheus client REST API.
#
# POST /api/v1/products/upload-spdx (multipart: cveId, file)
#
# Default SBOM: gitops OpenShift GitOps SPDX fixture used in tests and docs.
#
# Usage:
#   ./scripts/run-upload-spdx-analysis.sh
#   ./scripts/run-upload-spdx-analysis.sh path/to/sbom.spdx.json
#   CVE_ID=CVE-2024-1234 MORPHEUS_URL=https://host ./scripts/run-upload-spdx-analysis.sh
#
# Environment:
#   MORPHEUS_URL     Base URL of the Quarkus app (no trailing slash).
#                    Default: http://localhost:8080
#   CVE_ID           Vulnerability ID (must match ^CVE-[0-9]{4}-[0-9]{4,19}$).
#                    Default: CVE-2007-4559 (same as UploadSpdxRestTest)
#   SPDX_PATH        Default SPDX file when no positional argument (overrides built-in default)
#   BEARER_TOKEN     If set, sends Authorization: Bearer <token> (OIDC-protected deployments)
#   CURL_MAX_TIME    Optional; passed to curl as --max-time
#
# Response (HTTP 202): JSON with productId — use it to open the product report in the UI.
#
# Examples:
#   ./scripts/run-upload-spdx-analysis.sh
#   ./scripts/run-upload-spdx-analysis.sh -o /tmp/upload.json
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

readonly DEFAULT_SPDX="${REPO_ROOT}/src/test/resources/devservices/spdx-sboms/gitops-1.19-stripped.json"
readonly MORPHEUS_URL="${MORPHEUS_URL:-http://localhost:8080}"
readonly CVE_ID="${CVE_ID:-CVE-2007-4559}"
readonly UPLOAD_PATH="/api/v1/products/upload-spdx"

usage() {
  sed -n '1,35p' "$0" | sed 's/^# \{0,1\}//'
}

OUTPUT_PATH=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -o|--output)
      OUTPUT_PATH="${2:?}"
      shift 2
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

SPDX_PATH="${POSITIONAL[0]:-${SPDX_PATH:-$DEFAULT_SPDX}}"

if [[ ! -f "$SPDX_PATH" ]]; then
  echo "error: SPDX file not found: $SPDX_PATH" >&2
  exit 1
fi

ENDPOINT="${MORPHEUS_URL%/}${UPLOAD_PATH}"

AUTH_HEADER=()
if [[ -n "${BEARER_TOKEN:-}" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer ${BEARER_TOKEN}")
fi

TIME_ARGS=()
if [[ -n "${CURL_MAX_TIME:-}" ]]; then
  TIME_ARGS=(--max-time "${CURL_MAX_TIME}")
fi

echo "Morpheus URL: ${MORPHEUS_URL}" >&2
echo "CVE ID:       ${CVE_ID}" >&2
echo "SPDX file:    ${SPDX_PATH}" >&2
echo "POST:         ${ENDPOINT}" >&2

curl_common=(
  -sS "${TIME_ARGS[@]}"
  "${AUTH_HEADER[@]}"
  -X POST "${ENDPOINT}"
  -H "Accept: application/json"
  -F "cveId=${CVE_ID}"
  -F "file=@${SPDX_PATH};type=application/json;filename=$(basename "${SPDX_PATH}")"
)

if [[ -n "${OUTPUT_PATH}" ]]; then
  if curl -f "${curl_common[@]}" -o "${OUTPUT_PATH}"; then
    echo "Wrote response body to: ${OUTPUT_PATH}" >&2
    if command -v jq >/dev/null 2>&1; then
      jq . "${OUTPUT_PATH}" 2>/dev/null || true
    fi
  else
    echo "error: request failed (see curl message above)" >&2
    exit 1
  fi
else
  TMP_OUT="$(mktemp)"
  cleanup() { rm -f "${TMP_OUT}"; }
  trap cleanup EXIT
  if curl -f "${curl_common[@]}" -o "${TMP_OUT}" -w "\nHTTP %{http_code}\n" >&2; then
    if command -v jq >/dev/null 2>&1; then
      jq . "${TMP_OUT}"
    else
      cat "${TMP_OUT}"
    fi
  else
    echo "error: request failed" >&2
    [[ -s "${TMP_OUT}" ]] && cat "${TMP_OUT}" >&2
    exit 1
  fi
fi
