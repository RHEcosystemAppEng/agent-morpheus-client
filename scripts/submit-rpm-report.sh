#!/usr/bin/env bash
# Submit RPM analysis (POST /api/v1/reports/new-rpm-report) for local dev use.
#
# Defaults match request.json target_package plus sample CVE CVE-2024-2511.
#
# Usage:
#   ./scripts/submit-rpm-report.sh
#   ./scripts/submit-rpm-report.sh -c CVE-2024-9102
#   ./scripts/submit-rpm-report.sh -n openssl -V 3.5.1 -r 7.el9_7 -a x86_64 -c CVE-2024-2511
#
# Optional env: BASE_URL (default http://localhost:8080)
#
# Requires: curl; jq recommended for safely escaped JSON (falls back if absent)

set -euo pipefail

readonly BASE_URL="${BASE_URL:-http://localhost:8080}"
readonly ENDPOINT="${BASE_URL%/}/api/v1/reports/new-rpm-report"

PKG_NAME="openssl"
PKG_VERSION="3.5.1"
PKG_RELEASE="7.el9_7"
PKG_ARCH="x86_64"
CVE_ID="CVE-2024-2511"

usage() {
  cat <<'USAGE'
Usage: submit-rpm-report.sh [-n name] [-V version] [-r release] [-a arch] [-c cveId] [-h]

  -n    RPM package name     (default: openssl)
  -V    RPM version          (default: 3.5.1)
  -r    RPM release          (default: 7.el9_7)
  -a    architecture         (default: x86_64)
  -c    CVE id               (default: CVE-2024-2511)
  -h    show this help

Env: BASE_URL (default http://localhost:8080)
USAGE
}

while getopts "n:V:r:a:c:h" opt; do
  case "${opt}" in
    n) PKG_NAME="$OPTARG" ;;
    V) PKG_VERSION="$OPTARG" ;;
    r) PKG_RELEASE="$OPTARG" ;;
    a) PKG_ARCH="$OPTARG" ;;
    c) CVE_ID="$OPTARG" ;;
    h)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
done

tmp="$(mktemp)"
trap 'rm -f "${tmp}"' EXIT

if command -v jq >/dev/null 2>&1; then
  payload="$(jq -nc \
    --arg name "${PKG_NAME}" \
    --arg version "${PKG_VERSION}" \
    --arg release "${PKG_RELEASE}" \
    --arg arch "${PKG_ARCH}" \
    --arg cve "${CVE_ID}" \
    '{name:$name, version:$version, release:$release, arch:$arch, cveId:$cve}')"
else
  payload="$(printf '{"name":"%s","version":"%s","release":"%s","arch":"%s","cveId":"%s"}' \
    "${PKG_NAME}" "${PKG_VERSION}" "${PKG_RELEASE}" "${PKG_ARCH}" "${CVE_ID}")"
fi

echo "POST ${ENDPOINT}" >&2
echo "Body: ${payload}" >&2

http_code="$(curl --globoff -sS -o "${tmp}" -w '%{http_code}' \
  -X POST \
  -H 'Content-Type: application/json' \
  -d "${payload}" \
  "${ENDPOINT}")"

echo "HTTP ${http_code}" >&2
cat "${tmp}"
echo ""

[[ "${http_code}" == "202" ]]
