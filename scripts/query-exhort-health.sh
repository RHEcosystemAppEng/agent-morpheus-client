#!/usr/bin/env bash
# ==============================================================================
# Check that Trustify Dependency Analytics (Exhort) is reachable and responding.
#
# Many hosted Exhort endpoints (e.g. exhort.stage.devshift.net) do **not** expose
# Quarkus SmallRye GET routes such as /q/health/live on the public ingress (those
# URLs return 404). For those deployments, use the default **analysis** probe.
#
# Modes (--mode or EXHORT_HEALTH_MODE):
#   analysis (default) — POST a tiny valid CycloneDX 1.6 document to
#                        POST /api/v5/analysis; treats HTTP 2xx as healthy.
#   get                — GET EXHORT_HEALTH_PATH (e.g. /q/health/live) for
#                        self-hosted Exhort with management/health on the same URL.
#
# Usage:
#   ./scripts/query-exhort-health.sh
#   EXHORT_URL=https://other.example ./scripts/query-exhort-health.sh
#   ./scripts/query-exhort-health.sh --mode get --path /q/health/ready
#
# Environment:
#   EXHORT_URL              Base URL (no trailing slash). Default: https://exhort.stage.devshift.net
#   EXHORT_HEALTH_MODE      analysis | get. Default: analysis
#   EXHORT_HEALTH_PATH      Path for --mode get only. Default: /q/health/live
#   EXHORT_ANALYSIS_PATH    Path for --mode analysis. Default: /api/v5/analysis
#   EXHORT_BEARER_TOKEN     If set, sends Authorization: Bearer <token>
#   CURL_MAX_TIME           Optional; passed to curl as --max-time
#
# Exit status:
#   0 — Probe succeeded (see mode-specific rules above)
#   1 — Probe failed (HTTP error, timeout, or network failure)
#
# Examples:
#   ./scripts/query-exhort-health.sh
#   ./scripts/query-exhort-health.sh -q && echo OK
#   ./scripts/query-exhort-health.sh --mode get
# ==============================================================================

set -euo pipefail

readonly EXHORT_URL="${EXHORT_URL:-https://exhort.stage.devshift.net}"
readonly EXHORT_ANALYSIS_PATH="${EXHORT_ANALYSIS_PATH:-/api/v5/analysis}"

QUIET=false
MODE="${EXHORT_HEALTH_MODE:-analysis}"
HEALTH_PATH="${EXHORT_HEALTH_PATH:-/q/health/live}"

usage() {
  sed -n '1,45p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -q|--quiet)
      QUIET=true
      shift
      ;;
    --mode)
      MODE="${2:?}"
      shift 2
      ;;
    --path)
      HEALTH_PATH="${2:?}"
      shift 2
      ;;
    --quarkus-get)
      MODE="get"
      shift
      ;;
    *)
      echo "error: unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

case "${MODE}" in
  analysis|get) ;;
  *)
    echo "error: --mode must be 'analysis' or 'get' (got: ${MODE})" >&2
    exit 2
    ;;
esac

if [[ "${HEALTH_PATH}" != /* ]]; then
  HEALTH_PATH="/${HEALTH_PATH}"
fi
if [[ "${EXHORT_ANALYSIS_PATH}" != /* ]]; then
  echo "error: EXHORT_ANALYSIS_PATH must start with /" >&2
  exit 2
fi

AUTH_HEADER=()
if [[ -n "${EXHORT_BEARER_TOKEN:-}" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer ${EXHORT_BEARER_TOKEN}")
fi

TIME_ARGS=()
if [[ -n "${CURL_MAX_TIME:-}" ]]; then
  TIME_ARGS=(--max-time "${CURL_MAX_TIME}")
fi

TMP_BODY=""
cleanup() {
  [[ -n "${TMP_BODY}" && -f "${TMP_BODY}" ]] && rm -f "${TMP_BODY}"
}
trap cleanup EXIT

TMP_BODY="$(mktemp)"

# Minimal CycloneDX 1.6 document (valid JSON; hosted Exhort typically returns 200 quickly).
readonly MINIMAL_CYCLONEDX='{"bomFormat":"CycloneDX","specVersion":"1.6","version":1,"metadata":{"component":{"type":"application","bom-ref":"probe","name":"health-probe","version":"0"}}}'

if [[ "${MODE}" == "analysis" ]]; then
  ENDPOINT="${EXHORT_URL%/}${EXHORT_ANALYSIS_PATH}"
  if [[ "${QUIET}" != true ]]; then
    echo "POST ${ENDPOINT} (minimal CycloneDX probe)" >&2
  fi
  HTTP_CODE="$(curl -sS "${TIME_ARGS[@]}" "${AUTH_HEADER[@]}" \
    -o "${TMP_BODY}" \
    -w "%{http_code}" \
    -X POST "${ENDPOINT}" \
    -H "Content-Type: application/vnd.cyclonedx+json" \
    -H "Accept: application/json" \
    --data-binary "${MINIMAL_CYCLONEDX}")"
  if [[ "${QUIET}" != true ]]; then
    echo "HTTP ${HTTP_CODE}" >&2
  fi
  if [[ "${HTTP_CODE}" =~ ^2[0-9][0-9]$ ]]; then
    if [[ "${QUIET}" != true ]]; then
      if [[ -s "${TMP_BODY}" ]] && command -v jq >/dev/null 2>&1 && jq -e . "${TMP_BODY}" >/dev/null 2>&1; then
        jq . "${TMP_BODY}"
      else
        cat "${TMP_BODY}"
        [[ -s "${TMP_BODY}" ]] && echo ""
      fi
    fi
    exit 0
  fi
  if [[ "${QUIET}" != true ]]; then
    cat "${TMP_BODY}" >&2
  fi
  exit 1
fi

# --mode get: Quarkus SmallRye health (works when ingress exposes /q/health/*).
ENDPOINT="${EXHORT_URL%/}${HEALTH_PATH}"
HTTP_CODE="$(curl -sS "${TIME_ARGS[@]}" "${AUTH_HEADER[@]}" \
  -o "${TMP_BODY}" \
  -w "%{http_code}" \
  -X GET "${ENDPOINT}" \
  -H "Accept: application/json, text/plain, */*")"

if [[ "${QUIET}" != true ]]; then
  echo "GET ${ENDPOINT}" >&2
  echo "HTTP ${HTTP_CODE}" >&2
fi

if [[ "${HTTP_CODE}" =~ ^2[0-9][0-9]$ ]]; then
  if [[ "${QUIET}" != true ]]; then
    if [[ -s "${TMP_BODY}" ]] && command -v jq >/dev/null 2>&1 && jq -e . "${TMP_BODY}" >/dev/null 2>&1; then
      jq . "${TMP_BODY}"
    else
      cat "${TMP_BODY}"
      [[ -s "${TMP_BODY}" ]] && echo ""
    fi
  fi
  exit 0
fi

if [[ "${QUIET}" != true ]]; then
  cat "${TMP_BODY}" >&2
fi
exit 1
