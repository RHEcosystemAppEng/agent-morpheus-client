#!/bin/bash
# ==============================================================================
# Authentication Testing Script
# ==============================================================================
# This script automates testing of various authentication scenarios:
# - DevServices Keycloak (local development)
# - External Keycloak (standalone or with identity brokers)
# - Direct OIDC providers (Google)
#
# Usage: ./scripts/test-auth.sh [--help]
#
# For detailed documentation, see: docs/authentication.md
# ==============================================================================

set -e

# ==============================================================================
# CONFIGURATION - Customize these variables as needed
# ==============================================================================

# Application settings
readonly APP_SERVICE_NAME="${APP_SERVICE_NAME:-exploit-iq-client}"
readonly APP_CLIENT_ID="${APP_CLIENT_ID:-exploit-iq-client}"
readonly APP_CLIENT_SECRET="${APP_CLIENT_SECRET:-example-credentials}"

# Container engine (auto-detect podman or docker)
CONTAINER_ENGINE="${CONTAINER_ENGINE:-$(command -v podman >/dev/null 2>&1 && echo podman || echo docker)}"

# Keycloak settings
readonly KC_REALM="${KC_REALM:-quarkus}"
readonly KC_LOCAL_PORT="${KC_LOCAL_PORT:-8190}"
readonly KC_IMAGE="${KC_IMAGE:-quay.io/keycloak/keycloak:26.4}"
readonly KC_ADMIN_USER="${KC_ADMIN_USER:-admin}"
readonly KC_ADMIN_PASS="${KC_ADMIN_PASS:-admin}"
readonly KC_OCP_NAMESPACE="${KC_OCP_NAMESPACE:-keycloak-dev}"
readonly KC_CONTAINER_NAME="${KC_CONTAINER_NAME:-keycloak-standalone}"

# Local app settings
readonly LOCAL_APP_URL="${LOCAL_APP_URL:-http://localhost:8080}"

# Test users
readonly TEST_USER_1="${TEST_USER_1:-bruce}"
readonly TEST_USER_1_PASS="${TEST_USER_1_PASS:-wayne}"
readonly TEST_USER_1_EMAIL="${TEST_USER_1_EMAIL:-bruce@wayne.com}"
readonly TEST_USER_2="${TEST_USER_2:-peter}"
readonly TEST_USER_2_PASS="${TEST_USER_2_PASS:-parker}"
readonly TEST_USER_2_EMAIL="${TEST_USER_2_EMAIL:-peter@parker.com}"

# Timeouts
readonly HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-120}"
readonly ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-5m}"

# ==============================================================================
# INTERNAL VARIABLES
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_NAMESPACE=""
KC_BASE_URL=""
KC_TOKEN=""
DEBUG="${DEBUG:-false}"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

print_error() {
  echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
  echo -e "${GREEN}$1${NC}"
}

print_warning() {
  echo -e "${YELLOW}$1${NC}"
}

print_info() {
  echo "$1"
}

print_debug() {
  if [ "$DEBUG" = "true" ]; then
    echo -e "${YELLOW}[DEBUG] $1${NC}"
  fi
}

show_help() {
  cat << EOF
Authentication Testing Script

Usage: $0 [OPTIONS]

Options:
  --help, -h    Show this help message
  --debug, -d   Enable debug output (shows curl responses, URLs, etc.)

Environment Variables:
  APP_CLIENT_ID        OIDC client ID (default: exploit-iq-client)
  APP_CLIENT_SECRET    OIDC client secret (default: example-credentials)
  APP_SERVICE_NAME     Kubernetes deployment name (default: exploit-iq-client)
  CONTAINER_ENGINE     Container runtime: podman or docker (auto-detected)
  DEBUG              Enable debug mode (true/false, default: false)
  KC_ADMIN_PASS        Keycloak admin password (default: admin)
  KC_ADMIN_USER        Keycloak admin username (default: admin)
  KC_CONTAINER_NAME    Keycloak container name (default: keycloak-standalone)
  KC_IMAGE             Keycloak container image (default: quay.io/keycloak/keycloak:26.4)
  KC_LOCAL_PORT        Local Keycloak port (default: 8190)
  KC_OCP_NAMESPACE     OpenShift namespace for Keycloak (default: keycloak-dev)

Scenarios:
  1) DevServices Keycloak       - Local development with auto-configured Keycloak
  2) DevServices + GitHub       - Local Keycloak with GitHub identity broker
  3) External Keycloak          - Standalone external Keycloak
  4) External Keycloak + GitHub - External Keycloak with GitHub broker
  5) External Keycloak + Google - External Keycloak with Google broker
  6) Direct Google OIDC         - Direct connection to Google (no Keycloak)
  7) Import Keycloak Realm      - Import keycloak-realm.json (Miles/Gwen users)

Test Users (for Keycloak scenarios):
  - ${TEST_USER_1}/${TEST_USER_1_PASS}
  - ${TEST_USER_2}/${TEST_USER_2_PASS}

For more information, see: docs/authentication.md
EOF
  exit 0
}

check_dependencies() {
  local missing=()
  
  command -v curl >/dev/null 2>&1 || missing+=("curl")
  command -v jq >/dev/null 2>&1 || missing+=("jq")
  
  # Check for container engine
  if ! command -v podman >/dev/null 2>&1 && ! command -v docker >/dev/null 2>&1; then
    missing+=("podman or docker")
  fi
  
  if [ ${#missing[@]} -ne 0 ]; then
    print_error "Missing required dependencies: ${missing[*]}"
    exit 1
  fi
  
  print_info "Using container engine: ${CONTAINER_ENGINE}"
}

check_oc_dependency() {
  if ! command -v oc >/dev/null 2>&1; then
    print_error "OpenShift CLI (oc) is required for this scenario"
    exit 1
  fi
}

validate_not_empty() {
  local value="$1"
  local name="$2"
  
  if [ -z "$value" ]; then
    print_error "$name cannot be empty"
    exit 1
  fi
}

# ==============================================================================
# NAMESPACE DETECTION
# ==============================================================================

detect_ocp_namespace() {
  check_oc_dependency
  
  local detected_ns
  detected_ns=$(oc project -q 2>/dev/null || true)

  if [ -n "$detected_ns" ]; then
    echo ""
    print_info "Detected OpenShift Project/Namespace: '$detected_ns'"
    read -p "Is this the correct namespace for the application? [Y/n]: " confirm_ns
    confirm_ns=${confirm_ns:-Y}

    if [[ "$confirm_ns" =~ ^[Yy]$ ]]; then
      APP_NAMESPACE="$detected_ns"
    else
      read -p "Enter target OpenShift Project/Namespace: " APP_NAMESPACE
    fi
  else
    echo ""
    print_warning "Could not detect current OpenShift Project."
    read -p "Enter target OpenShift Project/Namespace: " APP_NAMESPACE
  fi

  validate_not_empty "$APP_NAMESPACE" "Namespace"
  print_info "Using Namespace: $APP_NAMESPACE"
  echo ""
}

# ==============================================================================
# KEYCLOAK SETUP FUNCTIONS
# ==============================================================================

setup_local_keycloak() {
  echo ""
  print_info "--- Setting up Keycloak (Local Container) ---"
  
  # Clean up existing container
  if ${CONTAINER_ENGINE} ps -a --format '{{.Names}}' | grep -q "^${KC_CONTAINER_NAME}$"; then
    print_info "Removing existing Keycloak container..."
    ${CONTAINER_ENGINE} rm -f "${KC_CONTAINER_NAME}" >/dev/null 2>&1 || true
  fi

  print_info "Starting Keycloak container with ${CONTAINER_ENGINE}..."
  ${CONTAINER_ENGINE} run -d --name "${KC_CONTAINER_NAME}" \
    -p "${KC_LOCAL_PORT}:8080" \
    -e "KEYCLOAK_ADMIN=${KC_ADMIN_USER}" \
    -e "KEYCLOAK_ADMIN_PASSWORD=${KC_ADMIN_PASS}" \
    -e KC_HEALTH_ENABLED=true \
    -e KC_METRICS_ENABLED=true \
    -e KC_HTTP_MANAGEMENT_HEALTH_ENABLED=false \
    -e KC_HOSTNAME=localhost \
    -e KC_HTTP_ENABLED=true \
    "${KC_IMAGE}" start-dev >/dev/null

  KC_BASE_URL="http://localhost:${KC_LOCAL_PORT}"
  wait_for_keycloak_health "$KC_BASE_URL"
  
  # Disable SSL requirement for local development (Keycloak 26.x requires this)
  print_info "Configuring Keycloak for HTTP access..."
  ${CONTAINER_ENGINE} exec "${KC_CONTAINER_NAME}" /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080 --realm master --user "${KC_ADMIN_USER}" --password "${KC_ADMIN_PASS}" >/dev/null
  ${CONTAINER_ENGINE} exec "${KC_CONTAINER_NAME}" /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE >/dev/null
  print_success "Keycloak configured for HTTP"
  echo ""
}

setup_ocp_keycloak() {
  check_oc_dependency
  
  echo ""
  print_info "--- Setting up Keycloak (OpenShift) ---"

  # Create namespace if not exists
  if ! oc get project "$KC_OCP_NAMESPACE" >/dev/null 2>&1; then
    print_info "Creating namespace '$KC_OCP_NAMESPACE'..."
    oc new-project "$KC_OCP_NAMESPACE" >/dev/null
  fi

  # Apply Keycloak resources
  print_info "Applying Keycloak resources..."
  oc process -f https://raw.githubusercontent.com/keycloak/keycloak-quickstarts/refs/heads/main/openshift/keycloak.yaml \
    -p "KC_BOOTSTRAP_ADMIN_USERNAME=${KC_ADMIN_USER}" \
    -p "KC_BOOTSTRAP_ADMIN_PASSWORD=${KC_ADMIN_PASS}" \
    -p "NAMESPACE=${KC_OCP_NAMESPACE}" \
  | oc apply -n "$KC_OCP_NAMESPACE" -f - >/dev/null

  # Inject Health settings
  oc set env dc/keycloak -n "$KC_OCP_NAMESPACE" \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true \
    KC_HTTP_MANAGEMENT_HEALTH_ENABLED=false

  print_info "Waiting for rollout..."
  oc rollout status dc/keycloak -n "$KC_OCP_NAMESPACE" --timeout="$ROLLOUT_TIMEOUT" >/dev/null

  # Detect Route
  print_info "Detecting Route..."
  local kc_route=""
  for _ in {1..10}; do
    kc_route=$(oc get route keycloak -n "$KC_OCP_NAMESPACE" -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
    if [ -n "$kc_route" ]; then break; fi
    sleep 2
  done

  if [ -z "$kc_route" ]; then
    print_error "Keycloak Route not found in namespace $KC_OCP_NAMESPACE"
    exit 1
  fi

  KC_BASE_URL="https://$kc_route"
  print_info "Keycloak URL: $KC_BASE_URL"
  wait_for_keycloak_health "$KC_BASE_URL"
}

wait_for_keycloak_health() {
  local url="$1"
  local health_url="${url}/health/ready"
  
  print_info "Waiting for Keycloak health check..."
  local count=0
  while [ $count -lt "$HEALTH_CHECK_TIMEOUT" ]; do
    if curl -k -s "$health_url" 2>/dev/null | grep -q '"status": "UP"'; then
      print_success "Keycloak is ready"
      return 0
    fi
    echo -n "."
    sleep 2
    count=$((count + 2))
  done
  
  echo ""
  print_error "Keycloak health check timed out after ${HEALTH_CHECK_TIMEOUT}s"
  exit 1
}

# ==============================================================================
# KEYCLOAK CONFIGURATION
# ==============================================================================

get_admin_token() {
  local token_url="${KC_BASE_URL}/realms/master/protocol/openid-connect/token"
  print_debug "Token URL: $token_url"
  print_debug "Admin user: ${KC_ADMIN_USER}"
  
  local response
  response=$(curl -k -s -X POST "$token_url" \
    -d "username=${KC_ADMIN_USER}" \
    -d "password=${KC_ADMIN_PASS}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli")
  
  print_debug "Token response: $response"
  
  KC_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$KC_TOKEN" ]; then
    print_error "Failed to obtain Keycloak admin token"
    print_error "Response: $response"
    exit 1
  fi
}

configure_keycloak() {
  local app_url="$1"
  print_info "--- Configuring Keycloak (via Realm Import) ---"
  import_keycloak_realm "$app_url"
}

# ==============================================================================
# IDENTITY PROVIDER CONFIGURATION
# ==============================================================================

configure_github_idp() {
  local client_id="$1"
  local client_secret="$2"
  
  validate_not_empty "$client_id" "GitHub Client ID"
  validate_not_empty "$client_secret" "GitHub Client Secret"
  
  get_admin_token
  
  echo -n "Configuring GitHub Identity Provider... "
  curl -k -s -o /dev/null -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/identity-provider/instances" \
    -H "Authorization: Bearer $KC_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"alias\": \"github\",
      \"providerId\": \"github\",
      \"enabled\": true,
      \"config\": {
        \"clientId\": \"${client_id}\",
        \"clientSecret\": \"${client_secret}\",
        \"defaultScope\": \"user:email\",
        \"syncMode\": \"IMPORT\"
      }
    }"
  print_success "done"
  
  # Add mappers
  echo -n "Creating GitHub mappers... "
  curl -k -s -o /dev/null -X POST \
    "${KC_BASE_URL}/admin/realms/${KC_REALM}/identity-provider/instances/github/mappers" \
    -H "Authorization: Bearer $KC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "github-username-mapper",
      "identityProviderAlias": "github",
      "identityProviderMapper": "github-user-attribute-mapper",
      "config": {
        "syncMode": "INHERIT",
        "jsonField": "login",
        "userAttribute": "username"
      }
    }'
  
  curl -k -s -o /dev/null -X POST \
    "${KC_BASE_URL}/admin/realms/${KC_REALM}/identity-provider/instances/github/mappers" \
    -H "Authorization: Bearer $KC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "github-email-mapper",
      "identityProviderAlias": "github",
      "identityProviderMapper": "github-user-attribute-mapper",
      "config": {
        "syncMode": "INHERIT",
        "jsonField": "email",
        "userAttribute": "email"
      }
    }'
  print_success "done"
}

configure_google_idp() {
  local client_id="$1"
  local client_secret="$2"
  
  validate_not_empty "$client_id" "Google Client ID"
  validate_not_empty "$client_secret" "Google Client Secret"
  
  get_admin_token
  
  echo -n "Configuring Google Identity Provider... "
  curl -k -s -o /dev/null -X POST "${KC_BASE_URL}/admin/realms/${KC_REALM}/identity-provider/instances" \
    -H "Authorization: Bearer $KC_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"alias\": \"google\",
      \"providerId\": \"google\",
      \"enabled\": true,
      \"config\": {
        \"clientId\": \"${client_id}\",
        \"clientSecret\": \"${client_secret}\",
        \"defaultScope\": \"openid email profile\"
      }
    }"
  print_success "done"
  
  # Add mappers
  echo -n "Creating Google mappers... "
  curl -k -s -o /dev/null -X POST \
    "${KC_BASE_URL}/admin/realms/${KC_REALM}/identity-provider/instances/google/mappers" \
    -H "Authorization: Bearer $KC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "google-email-mapper",
      "identityProviderAlias": "google",
      "identityProviderMapper": "oidc-user-attribute-idp-mapper",
      "config": {
        "syncMode": "INHERIT",
        "claim": "email",
        "user.attribute": "email"
      }
    }'
  print_success "done"
}

# ==============================================================================
# APPLICATION EXECUTION
# ==============================================================================

start_local_quarkus() {
  local extra_args=("$@")
  
  cd "$PROJECT_ROOT"
  print_info "Starting Quarkus in dev mode..."
  ./mvnw quarkus:dev "${extra_args[@]}"
}

update_ocp_deployment() {
  local env_vars=("$@")
  
  print_info "=== Updating Remote OCP Deployment ==="
  print_info "Target: deployment/${APP_SERVICE_NAME} in ${APP_NAMESPACE}"
  
  oc set env "deployment/${APP_SERVICE_NAME}" -n "$APP_NAMESPACE" \
    "${env_vars[@]}" \
    --overwrite
  
  print_success "Environment updated. Restarting deployment..."
  oc rollout restart "deployment/${APP_SERVICE_NAME}" -n "$APP_NAMESPACE"
  oc rollout status "deployment/${APP_SERVICE_NAME}" -n "$APP_NAMESPACE" --timeout="$ROLLOUT_TIMEOUT"
}

get_app_route() {
  local route_host
  route_host=$(oc get route "$APP_SERVICE_NAME" -n "$APP_NAMESPACE" -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
  
  if [ -z "$route_host" ]; then
    print_error "Could not find route '${APP_SERVICE_NAME}' in namespace '${APP_NAMESPACE}'"
    print_info "Available routes:"
    oc get routes -n "$APP_NAMESPACE" -o name
    exit 1
  fi
  
  echo "https://${route_host}"
}

# ==============================================================================
# SCENARIO HANDLERS
# ==============================================================================

scenario_devservices() {
  echo ""
  print_info "=== Scenario 1: DevServices Keycloak ==="
  print_info "Starting Quarkus with DevServices Keycloak..."
  echo ""
  print_info "Test users: ${TEST_USER_1}/${TEST_USER_1_PASS}, ${TEST_USER_2}/${TEST_USER_2_PASS}"
  print_info "App URL: ${LOCAL_APP_URL}"
  echo ""
  
  start_local_quarkus -Dquarkus.oidc.enabled=true -Dquarkus.keycloak.devservices.enabled=true
}

scenario_devservices_github() {
  echo ""
  print_info "=== Scenario 2: DevServices + GitHub Broker ==="
  
  setup_local_keycloak
  
  echo ""
  print_warning "GitHub OAuth Callback URL:"
  print_info "  ${KC_BASE_URL}/realms/${KC_REALM}/broker/github/endpoint"
  echo ""
  
  read -p "GitHub Client ID: " github_id
  read -p "GitHub Client Secret: " github_secret
  
  configure_keycloak "$LOCAL_APP_URL"
  configure_github_idp "$github_id" "$github_secret"
  
  echo ""
  print_info "App URL: ${LOCAL_APP_URL}"
  echo ""
  
  start_local_quarkus \
    -Dquarkus.profile=external-idp \
    "-Dquarkus.oidc.auth-server-url=${KC_BASE_URL}/realms/${KC_REALM}" \
    "-Dquarkus.oidc.credentials.secret=${APP_CLIENT_SECRET}" \
    -Dmorpheus.syncer.health.url=http://localhost:8088/exploit-iq/component-syncer
}

scenario_external_keycloak() {
  local broker_type="$1"  # "none", "github", or "google"
  
  echo ""
  print_info "Select Keycloak Environment:"
  echo "1) Local Docker (localhost:${KC_LOCAL_PORT})"
  echo "2) OpenShift (Auto-provision in '${KC_OCP_NAMESPACE}')"
  read -p "Option: " infra_choice

  local app_base_url=""
  local run_mode=""
  
  if [ "$infra_choice" = "2" ]; then
    detect_ocp_namespace
    setup_ocp_keycloak
    
    print_info "Detecting App Route in namespace '${APP_NAMESPACE}'..."
    app_base_url=$(get_app_route 2>/dev/null || echo "")
    
    if [ -n "$app_base_url" ]; then
      run_mode="remote"
      print_success "Found OCP App: ${app_base_url}"
    else
      print_warning "App Route not found. Falling back to Local App."
      app_base_url="$LOCAL_APP_URL"
      run_mode="local"
    fi
  else
    setup_local_keycloak
    app_base_url="$LOCAL_APP_URL"
    run_mode="local"
  fi

  configure_keycloak "$app_base_url"

  # Configure broker if needed
  if [ "$broker_type" = "github" ]; then
    echo ""
    print_warning "GitHub OAuth Callback URL:"
    print_info "  ${KC_BASE_URL}/realms/${KC_REALM}/broker/github/endpoint"
    echo ""
    read -p "GitHub Client ID: " broker_id
    read -p "GitHub Client Secret: " broker_secret
    configure_github_idp "$broker_id" "$broker_secret"
  elif [ "$broker_type" = "google" ]; then
    echo ""
    print_warning "Google OAuth Callback URL:"
    print_info "  ${KC_BASE_URL}/realms/${KC_REALM}/broker/google/endpoint"
    echo ""
    read -p "Google Client ID: " broker_id
    read -p "Google Client Secret: " broker_secret
    configure_google_idp "$broker_id" "$broker_secret"
  fi

  echo ""
  if [ "$run_mode" = "remote" ]; then
    # Keycloak mode: set auth-server-url, unset provider/client-id (use defaults)
    update_ocp_deployment \
      "QUARKUS_PROFILE=external-idp" \
      "QUARKUS_OIDC_AUTH_SERVER_URL=${KC_BASE_URL}/realms/${KC_REALM}" \
      "QUARKUS_OIDC_CREDENTIALS_SECRET=${APP_CLIENT_SECRET}" \
      "QUARKUS_OIDC_TLS_VERIFICATION=none" \
      "QUARKUS_OIDC_PROVIDER-" \
      "QUARKUS_OIDC_CLIENT_ID-"
    
    print_success "Done. Check app at ${app_base_url}"
  else
    start_local_quarkus \
      -Dquarkus.profile=external-idp \
      "-Dquarkus.oidc.auth-server-url=${KC_BASE_URL}/realms/${KC_REALM}" \
      "-Dquarkus.oidc.credentials.secret=${APP_CLIENT_SECRET}" \
      -Dquarkus.keycloak.devservices.enabled=false \
      -Dquarkus.oidc.tls.verification=none \
      "-Dquarkus.rest-client.component-syncer.url=http://localhost:8088/exploit-iq/component-syncer" \
      -Dmorpheus.syncer.health.url=http://localhost:8088/exploit-iq/component-syncer
  fi
}

scenario_direct_google() {
  echo ""
  print_info "=== Scenario 6: Direct Google OIDC ==="
  echo ""
  echo "Select Environment:"
  echo "1) Local (localhost:8080)"
  echo "2) OpenShift"
  read -p "Option: " env_choice
  
  read -p "Google Client ID: " google_id
  read -p "Google Client Secret: " google_secret
  
  validate_not_empty "$google_id" "Google Client ID"
  validate_not_empty "$google_secret" "Google Client Secret"
  
  if [ "$env_choice" = "2" ]; then
    detect_ocp_namespace
    
    local app_url
    app_url=$(get_app_route)
    
    echo ""
    print_warning "Add this EXACT URI to Google Cloud Console (Authorized redirect URIs):"
    print_info "  ${app_url}/"
    echo ""
    read -p "Press Enter when ready..."
    
    print_info "Updating Remote OCP Deployment for Direct Google..."
    
    # Direct Google mode: set provider/client-id, unset auth-server-url/tls
    update_ocp_deployment \
      "QUARKUS_PROFILE=external-idp" \
      "QUARKUS_OIDC_PROVIDER=google" \
      "QUARKUS_OIDC_CLIENT_ID=${google_id}" \
      "QUARKUS_OIDC_CREDENTIALS_SECRET=${google_secret}" \
      "QUARKUS_OIDC_AUTH_SERVER_URL-" \
      "QUARKUS_OIDC_TLS_VERIFICATION-"
    
    print_success "Done. Check app at ${app_url}"
  else
    echo ""
    print_warning "Add this URI to Google Cloud Console (Authorized redirect URIs):"
    print_info "  http://localhost:8080/"
    echo ""
    
    start_local_quarkus \
      -Dquarkus.oidc.provider=google \
      "-Dquarkus.oidc.client-id=${google_id}" \
      "-Dquarkus.oidc.credentials.secret=${google_secret}" \
      -Dquarkus.keycloak.devservices.enabled=false
  fi
}

import_keycloak_realm() {
  local app_url="$1"
  local realm_file="${PROJECT_ROOT}/src/test/resources/devservices/keycloak-realm.json"
  
  if [ ! -f "$realm_file" ]; then
    print_error "Realm file not found: $realm_file"
    exit 1
  fi
  
  print_info "--- Importing Keycloak Realm from JSON ---"
  get_admin_token
  
  # Delete existing realm for clean state
  echo -n "Cleaning up existing realm... "
  curl -k -s -X DELETE "${KC_BASE_URL}/admin/realms/${KC_REALM}" \
    -H "Authorization: Bearer $KC_TOKEN" || true
  print_success "done"
  
  sleep 1
  
  # Update redirectUris in realm JSON dynamically
  echo -n "Preparing realm configuration... "
  local temp_realm="/tmp/keycloak-realm-updated.json"
  
  if command -v jq >/dev/null 2>&1; then
    # Use jq if available
    jq --arg url "${app_url}/*" \
       --arg origin "${app_url}" \
       --arg cid "${APP_CLIENT_ID}" \
       --arg csec "${APP_CLIENT_SECRET}" \
       '.clients[0].redirectUris = [$url] | .clients[0].webOrigins = [$origin] | .clients[0].clientId = $cid | .clients[0].secret = $csec' \
      "$realm_file" > "$temp_realm"
  else
    # Fallback to sed
    cp "$realm_file" "$temp_realm"
    # This is a simple replacement, may need adjustment based on JSON structure
    print_warning "jq not found, using sed (less reliable)"
  fi
  print_success "done"
  
  # Import realm
  echo -n "Importing realm '${KC_REALM}'... "
  local import_response
  import_response=$(curl -k -s -w "\n%{http_code}" -X POST "${KC_BASE_URL}/admin/realms" \
    -H "Authorization: Bearer $KC_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$temp_realm")
  
  local http_code="${import_response##*$'\n'}"
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "204" ]; then
    print_success "done"
  else
    print_error "Failed to import realm (HTTP $http_code)"
    echo "$import_response" | head -n -1
    exit 1
  fi
  
  rm -f "$temp_realm"
  
  print_success "Keycloak realm imported successfully"
  print_info "Test users: miles/morales, gwen/stacy"
}

scenario_import_realm() {
  echo ""
  print_info "=== Scenario 7: Import Keycloak Realm (keycloak-realm.json) ==="
  
  echo ""
  print_info "Select Keycloak Environment:"
  echo "1) Local Docker (localhost:${KC_LOCAL_PORT})"
  echo "2) OpenShift (Auto-provision in '${KC_OCP_NAMESPACE}')"
  read -p "Option: " infra_choice
  
  local app_base_url=""
  local run_mode=""
  
  if [ "$infra_choice" = "2" ]; then
    detect_ocp_namespace
    setup_ocp_keycloak
    
    print_info "Detecting App Route in namespace '${APP_NAMESPACE}'..."
    app_base_url=$(get_app_route 2>/dev/null || echo "")
    
    if [ -n "$app_base_url" ]; then
      run_mode="remote"
      print_success "Found OCP App: ${app_base_url}"
    else
      print_warning "App Route not found. Falling back to Local App."
      app_base_url="$LOCAL_APP_URL"
      run_mode="local"
    fi
  else
    setup_local_keycloak
    app_base_url="$LOCAL_APP_URL"
    run_mode="local"
  fi
  
  import_keycloak_realm "$app_base_url"
  
  echo ""
  if [ "$run_mode" = "remote" ]; then
    update_ocp_deployment \
      "QUARKUS_PROFILE=external-idp" \
      "QUARKUS_OIDC_AUTH_SERVER_URL=${KC_BASE_URL}/realms/${KC_REALM}" \
      "QUARKUS_OIDC_CREDENTIALS_SECRET=${APP_CLIENT_SECRET}" \
      "QUARKUS_OIDC_TLS_VERIFICATION=none" \
      "QUARKUS_OIDC_PROVIDER-" \
      "QUARKUS_OIDC_CLIENT_ID-"
    
    print_success "Done. Check app at ${app_base_url}"
    print_info "Login with: miles/morales or gwen/stacy"
  else
    print_info "Starting local Quarkus app..."
    print_info "Login with: miles/morales or gwen/stacy"
    echo ""
    
    start_local_quarkus \
      -Dquarkus.profile=external-idp \
      "-Dquarkus.oidc.auth-server-url=${KC_BASE_URL}/realms/${KC_REALM}" \
      "-Dquarkus.oidc.credentials.secret=${APP_CLIENT_SECRET}" \
      -Dquarkus.keycloak.devservices.enabled=false \
      -Dquarkus.oidc.tls.verification=none \
      -Dmorpheus.syncer.health.url=http://localhost:8088/exploit-iq/component-syncer
  fi
}

# ==============================================================================
# MAIN
# ==============================================================================

main() {
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --help|-h)
        show_help
        ;;
      --debug|-d)
        DEBUG=true
        shift
        ;;
      *)
        shift
        ;;
    esac
  done

  check_dependencies
  cd "$PROJECT_ROOT"

  echo "=========================================="
  echo "  Authentication Test Automation"
  echo "=========================================="
  echo ""
  echo "--- Local Only (no OCP) ---"
  echo "1) DevServices Keycloak (Local Only)"
  echo "2) DevServices + GitHub Broker (Local Only)"
  echo ""
  echo "--- External Keycloak (Local or OCP) ---"
  echo "3) External Keycloak (Standard)"
  echo "4) External Keycloak + GitHub Broker"
  echo "5) External Keycloak + Google Broker"
  echo ""
  echo "--- Direct OIDC ---"
  echo "6) Direct Google OIDC"
  echo ""
  echo "--- Import Realm ---"
  echo "7) Import Keycloak Realm (keycloak-realm.json)"
  echo ""
  read -p "Enter option: " choice

  case "$choice" in
    1)
      scenario_devservices
      ;;
    2)
      scenario_devservices_github
      ;;
    3)
      scenario_external_keycloak "none"
      ;;
    4)
      scenario_external_keycloak "github"
      ;;
    5)
      scenario_external_keycloak "google"
      ;;
    6)
      scenario_direct_google
      ;;
    7)
      scenario_import_realm
      ;;
    *)
      print_error "Invalid option: $choice"
      exit 1
      ;;
  esac
}

main "$@"
