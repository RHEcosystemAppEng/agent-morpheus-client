#!/bin/bash
# ==============================================================================
# Exhort Testing Script
# ==============================================================================
# This script automates testing of Exhort API.
# It gets all vulnerabilities for a given SBOM file (CycloneDX JSON) and prints the vulnerabilities.
# Used for dev purposes to check if the API is working.
#
# Usage: ./src/test/scripts/test-exhort.sh <cyclonedx-sbom-file>
# Example: ./src/test/scripts/test-exhort.sh ./src/test/resources/devservices/cyclonedx-sboms/nmstate-rhel8-operator.json
# ==============================================================================

set -e

SBOM_FILE="${1:?Usage: $0 <cyclonedx-sbom-file>}"

if [[ ! -f "$SBOM_FILE" ]]; then
  echo "Error: file not found: $SBOM_FILE" >&2
  exit 1
fi

echo "Getting all vulnerabilities for $SBOM_FILE" >&2
curl -X POST "https://exhort.stage.devshift.net/api/v5/analysis" \
  -H "Content-Type: application/vnd.cyclonedx+json" \
  --data-binary @"$SBOM_FILE" | jq .