#!/usr/bin/env bash
# ==============================================================================
# Run Trustify Dependency Analytics (Exhort) analysis on a CycloneDX SBOM.
#
# Uses POST /api/v5/analysis with Content-Type: application/vnd.cyclonedx+json
# (see https://github.com/guacsec/trustify-da-api-spec ).
#
# By default sends the optional v5 query parameter `cves` (comma-separated CVE
# IDs) so the response is filtered to those CVEs (see trustify-da-api-spec PR #105).
#
# Default SBOM: nmstate CycloneDX fixture in this repository.
#
# Usage:
#   ./scripts/run-exhort-on-sbom.sh [path-to-sbom.json]
#   ./scripts/run-exhort-on-sbom.sh --all-cves [path-to-sbom.json]
#   ./scripts/run-exhort-on-sbom.sh -c CVE-2024-1234,CVE-2024-5678 [path-to-sbom.json]
#   EXHORT_URL=https://other.example ./scripts/run-exhort-on-sbom.sh
#
# Environment:
#   EXHORT_URL          Base URL (no trailing slash). Default: https://exhort.stage.devshift.net
#   EXHORT_BEARER_TOKEN If set, sends Authorization: Bearer <token>
#   EXHORT_CVES         Default `cves` query value when neither -c nor --all-cves is used.
#                       Default: CVE-2007-4559 (matches dev WireMock stubs / common local testing).
#   SBOM_PATH           Default SBOM when no positional argument is given (overrides built-in default if set)
#   CURL_MAX_TIME       Optional; passed to curl as --max-time (large SBOMs may need more time)
#
# Examples:
#   ./scripts/run-exhort-on-sbom.sh
#   ./scripts/run-exhort-on-sbom.sh src/test/resources/devservices/cyclonedx-sboms/nmstate-missing-sourceurl.json
#   ./scripts/run-exhort-on-sbom.sh -o /tmp/out.json
#   ./scripts/run-exhort-on-sbom.sh --all-cves -o /tmp/full.json
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

readonly DEFAULT_SBOM="${REPO_ROOT}/src/test/resources/devservices/cyclonedx-sboms/nmstate-rhel8-operator.json"
readonly DEFAULT_CVES="${EXHORT_CVES:-CVE-2007-4559}"
readonly EXHORT_URL="${EXHORT_URL:-https://exhort.stage.devshift.net}"
readonly ANALYSIS_PATH="/api/v5/analysis"

usage() {
  sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
}

# Append ?cves=... or &cves=... to URL; value is percent-encoded for safe comma/query handling.
append_cves_query() {
  local base="$1"
  local cves="$2"
  local encoded
  if command -v jq >/dev/null 2>&1; then
    encoded="$(printf '%s' "$cves" | jq -sRr @uri)"
  else
    encoded="$cves"
  fi
  case "$base" in
    *\?*) printf '%s&cves=%s' "$base" "$encoded" ;;
    *)    printf '%s?cves=%s' "$base" "$encoded" ;;
  esac
}

OUTPUT_PATH=""
ALL_CVES=0
CVES_CLI=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --all-cves)
      ALL_CVES=1
      shift
      ;;
    -c|--cves)
      CVES_CLI="${2:?option $1 requires a value (comma-separated CVE IDs, or use --all-cves)}"
      shift 2
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

SBOM_PATH="${POSITIONAL[0]:-${SBOM_PATH:-$DEFAULT_SBOM}}"

if [[ ! -f "$SBOM_PATH" ]]; then
  echo "error: SBOM file not found: $SBOM_PATH" >&2
  exit 1
fi

ENDPOINT="${EXHORT_URL%/}${ANALYSIS_PATH}"

REQUEST_URL="$ENDPOINT"
if [[ "$ALL_CVES" -eq 1 ]]; then
  REQUEST_URL="$ENDPOINT"
elif [[ -n "$CVES_CLI" ]]; then
  REQUEST_URL="$(append_cves_query "$ENDPOINT" "$CVES_CLI")"
else
  REQUEST_URL="$(append_cves_query "$ENDPOINT" "$DEFAULT_CVES")"
fi

AUTH_HEADER=()
if [[ -n "${EXHORT_BEARER_TOKEN:-}" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer ${EXHORT_BEARER_TOKEN}")
fi

TIME_ARGS=()
if [[ -n "${CURL_MAX_TIME:-}" ]]; then
  TIME_ARGS=(--max-time "${CURL_MAX_TIME}")
fi

echo "Exhort URL:   ${EXHORT_URL}" >&2
echo "SBOM file:    ${SBOM_PATH}" >&2
echo "POST:         ${REQUEST_URL}" >&2
if [[ "$ALL_CVES" -eq 1 ]]; then
  echo "cves query:   (omitted — full CVE set from Exhort)" >&2
elif [[ -n "$CVES_CLI" ]]; then
  echo "cves query:   ${CVES_CLI}" >&2
else
  echo "cves query:   ${DEFAULT_CVES} (override with -c/--cves, EXHORT_CVES, or --all-cves)" >&2
fi

TMP_OUT=""
cleanup() {
  [[ -n "${TMP_OUT}" && -f "${TMP_OUT}" ]] && rm -f "${TMP_OUT}"
}
trap cleanup EXIT

if [[ -n "${OUTPUT_PATH}" ]]; then
  if curl -f -sS "${TIME_ARGS[@]}" "${AUTH_HEADER[@]}" \
    -X POST "${REQUEST_URL}" \
    -H "Content-Type: application/vnd.cyclonedx+json" \
    -H "Accept: application/json" \
    --data-binary "@${SBOM_PATH}" \
    -o "${OUTPUT_PATH}"; then
    echo "Wrote response body to: ${OUTPUT_PATH}" >&2
    if command -v jq >/dev/null 2>&1; then
      jq . "${OUTPUT_PATH}" >/dev/null 2>&1 || echo "note: response may not be JSON; inspect file manually" >&2
    fi
  else
    echo "error: request failed (see curl message above)" >&2
    exit 1
  fi
else
  TMP_OUT="$(mktemp)"
  if curl -f -sS "${TIME_ARGS[@]}" "${AUTH_HEADER[@]}" \
    -o "${TMP_OUT}" \
    -X POST "${REQUEST_URL}" \
    -H "Content-Type: application/vnd.cyclonedx+json" \
    -H "Accept: application/json" \
    --data-binary "@${SBOM_PATH}"; then
    if command -v jq >/dev/null 2>&1; then
      jq . "${TMP_OUT}"
    else
      cat "${TMP_OUT}"
    fi
  else
    echo "error: request failed (HTTP error or network)" >&2
    [[ -s "${TMP_OUT}" ]] && cat "${TMP_OUT}" >&2
    exit 1
  fi
fi
