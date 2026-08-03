<!--
SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
SPDX-License-Identifier: Apache-2.0
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Authentication

This guide covers authentication configuration for ExploitIQ Client, including OpenShift OAuth, external identity providers (Keycloak, AWS Cognito, Google, and others), and development setups.

## Overview

ExploitIQ supports multiple authentication modes via Quarkus profiles:

| Profile | Use Case | Identity Provider |
|---------|----------|-------------------|
| `prod` | OpenShift | OpenShift OAuth |
| `external-idp` | External identity providers | Keycloak, AWS Cognito, Google, Azure AD, Okta |
| `dev` | Local development | Keycloak DevServices (OIDC off by default) |

No Cognito-specific Quarkus profile is required. Point the existing `external-idp` profile at a Cognito User Pool (discovery, hybrid app type, and access-token role source already fit Cognito).

### Authentication Methods

All profiles support both browser and API authentication:

| Method | Use Case | Flow |
|--------|----------|------|
| Browser | Web UI | Authorization Code Flow (redirects to IdP) |
| API | CLI, scripts, services, agent | Bearer JWT token in `Authorization` header |

**Token acquisition differs by profile / IdP:**

- `prod` (OpenShift): Use `oc whoami -t` or ServiceAccount tokens
- `external-idp` (Keycloak): OIDC token endpoint with password or client_credentials grant
- `external-idp` (AWS Cognito): Hosted UI / managed login for browsers; `client_credentials` with **Basic auth** for M2M (agent)
- `dev`: OIDC disabled by default; optional Keycloak DevServices when enabled

## OpenShift OAuth (Production)

The default production configuration uses OpenShift's built-in OAuth server.

### Prerequisites

Create an `OAuthClient` resource in your OpenShift cluster:

```yaml
apiVersion: oauth.openshift.io/v1
kind: OAuthClient
metadata:
  name: exploit-iq-client
grantMethod: prompt
secret: <your-oauth-client-secret>
redirectURIs:
  - "https://exploit-iq-client.<your-domain>"
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENSHIFT_DOMAIN` | OpenShift cluster domain | `example.openshift.com` |
| `OAUTH_CLIENT_SECRET` | Secret from OAuthClient resource | `<your-secret>` |

### Deployment Configuration

```yaml
spec:
  containers:
  - name: exploit-iq-client
    env:
    - name: OPENSHIFT_DOMAIN
      valueFrom:
        secretKeyRef:
          name: oauth-config
          key: domain
    - name: OAUTH_CLIENT_SECRET
      valueFrom:
        secretKeyRef:
          name: oauth-config
          key: secret
```

### API Access (prod profile)

For API access in OpenShift, use your user token:

```bash
# After oc login
TOKEN=$(oc whoami -t)
curl -H "Authorization: Bearer $TOKEN" https://exploit-iq-client.apps.example.com/api/v1/reports
```

## External Identity Providers

Use the `external-idp` profile to integrate with external OIDC providers.

### Keycloak

Keycloak can be used standalone or as an identity broker for GitHub, Google, and other providers.

#### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `QUARKUS_PROFILE` | Must be `external-idp` | `external-idp` |
| `QUARKUS_OIDC_AUTH_SERVER_URL` | Keycloak realm URL | `https://keycloak.example.com/realms/<your-realm>` |
| `QUARKUS_OIDC_CREDENTIALS_SECRET` | OIDC client secret | `<your-client-secret>` |

**Note:** The testing script uses `quarkus` as the default realm name. Replace with your actual realm name in production.

#### Keycloak Client Configuration

Create an OIDC client in Keycloak with the following settings:

```json
{
  "clientId": "exploit-iq-client",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "<your-client-secret>",
  "redirectUris": ["https://your-app-url/*"],
  "webOrigins": ["https://your-app-url"],
  "publicClient": false,
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": true
}
```

**Important:** `directAccessGrantsEnabled: true` is required for API authentication via password grant.

Required protocol mappers (add to client scope):

- `preferred_username`: Maps `username` to `preferred_username` claim
- `email`: Maps `email` to `email` claim
- `upn`: Maps `username` to `upn` claim (fallback)

### Direct Google OIDC

Connect directly to Google without Keycloak.

#### Prerequisites

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://your-app-url/`

#### Environment Variables

| Variable | Description |
|----------|-------------|
| `QUARKUS_PROFILE` | `external-idp` |
| `QUARKUS_OIDC_PROVIDER` | `google` |
| `QUARKUS_OIDC_CLIENT_ID` | Google Client ID |
| `QUARKUS_OIDC_CREDENTIALS_SECRET` | Google Client Secret |

#### Deployment Example

```yaml
env:
- name: QUARKUS_PROFILE
  value: "external-idp"
- name: QUARKUS_OIDC_PROVIDER
  value: "google"
- name: QUARKUS_OIDC_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: google-oauth
      key: client-id
- name: QUARKUS_OIDC_CREDENTIALS_SECRET
  valueFrom:
    secretKeyRef:
      name: google-oauth
      key: client-secret
```

### AWS Cognito

Use the `external-idp` profile with an AWS Cognito User Pool for browser login and (with extra config) agent M2M bearer tokens.

Cognito differs from Keycloak in important ways:

| Topic | Cognito behavior |
|-------|------------------|
| Human roles | JWT `cognito:groups` claim (group names must match ExploitIQ roles exactly) |
| M2M tokens | `client_credentials` tokens have **no** `cognito:groups`; authorize via OAuth2 `scope` → role mapping |
| Token endpoint | `https://{domain}.auth.{region}.amazoncognito.com/oauth2/token` |
| Client credentials | Requires **HTTP Basic** auth (`client_id:client_secret`), not body-only client auth |
| Browser scopes | `openid`, `profile`, `email` (custom Resource Server scopes are for M2M only) |

Role extraction is implemented in `RoleMappingAugmentor` (additive alongside OpenShift `groups` and Keycloak `realm_access` / `resource_access`). Do **not** set `quarkus.oidc.roles.role-claim-path=cognito:groups` on the shared `external-idp` profile — that would break Keycloak on the same profile.

#### Cognito prerequisites (AWS Console)

1. **User Pool** in your region.
2. **Groups** named exactly:
   - `exploit-iq-admin`
   - `exploit-iq-view`
   - `exploit-iq-prodsec`
   - optionally `exploitiq-api-access` (for human users that should act like the API service role)
3. **App client** (confidential / client secret) for the web UI:
   - Authorization code grant
   - Callback / sign-out URLs: your app origin (include both with and without trailing slash if needed), e.g. `http://localhost:8080` and `http://localhost:8080/`
   - OpenID scopes: `openid`, `email`, `profile`
4. **Cognito domain** (Amazon Cognito domain prefix is enough; custom domain is optional).
5. **Users** in the pool, assigned to the groups above; set a **permanent** password for local testing (Forgot password needs email/SES configured).
6. For **agent M2M** (optional, separate from browser client if desired):
   - Resource Server with a custom scope, e.g. identifier `exploitiq-resource-server`, scope `exploitiq-api-access`
   - App client with **client_credentials** grant and that custom scope enabled

#### Environment variables (exploit-iq-client)

| Variable | Description | Example |
|----------|-------------|---------|
| `QUARKUS_PROFILE` | Use `external-idp` (locally prefer `dev,external-idp` so `%dev` defaults still apply) | `external-idp` or `dev,external-idp` |
| `QUARKUS_OIDC_AUTH_SERVER_URL` | Cognito **issuer** URL (User Pool), **not** the Hosted UI domain and **not** `.../.well-known/openid-configuration` | `https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_AbCdEf123` |
| `QUARKUS_OIDC_CLIENT_ID` | App client ID | Cognito console → App clients |
| `QUARKUS_OIDC_CREDENTIALS_SECRET` | App client secret | Cognito console → App clients |
| `EXPLOITIQ_SECURITY_OIDC_SCOPE_ROLE_MAPPINGS` | Optional M2M mapping: comma-separated `scope=role` pairs | `exploitiq-resource-server/exploitiq-api-access=exploitiq-api-access` |
| `NAMESPACE` | Required for service-account role string expansion | OpenShift namespace, or `local-dev` locally |
| `CREDENTIAL_ENCRYPTION_KEY` | 32-byte key for credential store (unrelated to Cognito) | Deployment secret |

Discover endpoints automatically via:

`https://cognito-idp.{region}.amazonaws.com/{user-pool-id}/.well-known/openid-configuration`

Quarkus appends `/.well-known/openid-configuration` itself — set `QUARKUS_OIDC_AUTH_SERVER_URL` to the issuer only.

#### Deployment example

```yaml
env:
- name: QUARKUS_PROFILE
  value: "external-idp"
- name: QUARKUS_OIDC_AUTH_SERVER_URL
  value: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_AbCdEf123"
- name: QUARKUS_OIDC_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: cognito-oidc
      key: client-id
- name: QUARKUS_OIDC_CREDENTIALS_SECRET
  valueFrom:
    secretKeyRef:
      name: cognito-oidc
      key: client-secret
# Required for agent/M2M bearer tokens (client_credentials) — omit for browser-only
- name: EXPLOITIQ_SECURITY_OIDC_SCOPE_ROLE_MAPPINGS
  value: "exploitiq-resource-server/exploitiq-api-access=exploitiq-api-access"
```

#### Local development with Cognito

```bash
export NAMESPACE=local-dev
export CREDENTIAL_ENCRYPTION_KEY='dev-test-key-must-be-32bytes-long!'
export QUARKUS_PROFILE=dev,external-idp
export QUARKUS_OIDC_AUTH_SERVER_URL='https://cognito-idp.{region}.amazonaws.com/{user-pool-id}'
export QUARKUS_OIDC_CLIENT_ID='{cognito-app-client-id}'
export QUARKUS_OIDC_CREDENTIALS_SECRET='{cognito-app-client-secret}'
# Optional M2M:
# export EXPLOITIQ_SECURITY_OIDC_SCOPE_ROLE_MAPPINGS='exploitiq-resource-server/exploitiq-api-access=exploitiq-api-access'

./mvnw quarkus:dev \
  -Dquarkus.rest-client.exploit-iq.url=http://localhost:26466/generate
```

Open `http://localhost:8080` — you should be redirected to Cognito managed login / Hosted UI.

**Session cookies:** After login, Quarkus stores an **HttpOnly** session cookie (typically `q_session`) on the app origin (`localhost:8080`). You will not see the Cognito JWT in `document.cookie` or as a readable Cognito token cookie. Check DevTools → Application → Cookies → `http://localhost:8080`.

#### Verify browser roles (`cognito:groups`)

1. Confirm the user is a member of `exploit-iq-admin` (or `view` / `prodsec`) in Cognito.
2. After login, APIs should return **200** (not **403**).
3. Quarkus logs should include: `Mapping user to role 'exploit-iq-admin' from source: Cognito Group`.
4. Optional: decode the **access** token (not only the ID token) and confirm a `cognito:groups` array with those exact names.

#### Agent / M2M bearer tokens (client side)

Cognito `client_credentials` access tokens do **not** include `cognito:groups`. The client authorizes them by mapping the token `scope` claim via `exploitiq.security.oidc.scope-role-mappings` (env: `EXPLOITIQ_SECURITY_OIDC_SCOPE_ROLE_MAPPINGS`) onto an allowed role such as `exploitiq-api-access` (already listed in `exploitiq.security.service-account-roles`).

Fetch a token (agent-side code lives in the vulnerability-analysis repo; this shows the Cognito contract):

```bash
COGNITO_DOMAIN="{prefix}.auth.{region}.amazoncognito.com"   # from Cognito Domain, not cognito-idp issuer
CLIENT_ID="{m2m-app-client-id}"
CLIENT_SECRET="{m2m-app-client-secret}"
SCOPE="exploitiq-resource-server/exploitiq-api-access"

TOKEN=$(curl -s -X POST "https://${COGNITO_DOMAIN}/oauth2/token" \
  -u "${CLIENT_ID}:${CLIENT_SECRET}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=${SCOPE}" | jq -r .access_token)

curl -i -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:8080/api/v1/reports
```

Expect **200** when scope mapping is configured on the client. Without `EXPLOITIQ_SECURITY_OIDC_SCOPE_ROLE_MAPPINGS`, the token may authenticate but fail authorization (**403**).

**Note:** Implementing Cognito token fetch in the Python agent (`AUTH_TYPE=cognito`, `COGNITO_DOMAIN`, etc.) is outside this repository.

### Other OIDC Providers

The same `external-idp` approach works with other OIDC-compliant providers:

| Provider | Auth Server URL |
|----------|-----------------|
| Azure AD | `https://login.microsoftonline.com/{tenant}/v2.0` |
| Okta | `https://dev-xxxxx.okta.com/oauth2/default` |
| Auth0 | `https://your-domain.auth0.com` |
| AWS Cognito | See [AWS Cognito](#aws-cognito) above |

**Note:** GitHub does not support OIDC. Use Keycloak as an identity broker for GitHub authentication.

## API Authentication with JWT (external-idp)

When using Keycloak or other OIDC providers, you can obtain tokens via the standard OIDC token endpoint. This allows CLI tools, scripts, and external services to authenticate without browser interaction.

### Obtaining a User Token

Use the password grant to obtain a token for a specific user:

```bash
# Configuration (match your Keycloak setup)
KC_URL="http://localhost:8190"           # Keycloak URL
KC_REALM="quarkus"                       # Realm name
CLIENT_ID="exploit-iq-client"            # Client ID
CLIENT_SECRET="example-credentials"      # Client secret
USERNAME="bruce"                         # User
PASSWORD="wayne"                         # Password

# Get user token (scope=openid is REQUIRED)
USER_TOKEN=$(curl -s -X POST \
  "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "username=${USERNAME}" \
  -d "password=${PASSWORD}" \
  -d "grant_type=password" \
  -d "scope=openid profile email" | jq -r '.access_token')

# Verify token was obtained
echo "Token: ${USER_TOKEN:0:50}..."
```

**Important:** The `scope=openid profile email` parameter is required. Without `openid`, the UserInfo endpoint will reject the token with "Missing openid scope" error.

### Making API Requests

Use the token in the `Authorization` header:

```bash
# List reports
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:8080/api/v1/reports

# Get specific report
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:8080/api/v1/reports/{id}
```

### Service-to-Service Authentication (Optional)

For machine-to-machine communication with **Keycloak**, use the client credentials grant:

```bash
# Get service token
SERVICE_TOKEN=$(curl -s -X POST \
  "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token" \
  -d "client_id=${SERVICE_CLIENT_ID}" \
  -d "client_secret=${SERVICE_SECRET}" \
  -d "grant_type=client_credentials" | jq -r '.access_token')

curl -H "Authorization: Bearer $SERVICE_TOKEN" \
  http://localhost:8080/api/v1/reports
```

**Note:** Requires a separate Keycloak client configured for service accounts.

For **AWS Cognito** M2M (`client_credentials` + Basic auth + custom scope), see [AWS Cognito — Agent / M2M bearer tokens](#agent--m2m-bearer-tokens-client-side).

### Token Validation

The application validates JWT tokens by:

1. Verifying the signature using JWKS from the IdP
2. Checking token expiration
3. Validating the issuer (`iss` claim)
4. Fetching UserInfo to extract user details

## Identity Brokering with Keycloak

Keycloak can act as an identity broker, allowing users to authenticate via external providers while maintaining centralized user management.

### Architecture

```
User → Application → Keycloak (Broker) → External IdP (GitHub/Google)
                          ↓
                    Token Issuance
                          ↓
                     Application
```

### GitHub Identity Broker

1. Create GitHub OAuth App at [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Set callback URL: `https://<your-keycloak>/realms/<your-realm>/broker/github/endpoint`
3. Configure in Keycloak: Identity Providers → Add GitHub
4. Add mappers:
   - `login` → `preferred_username`
   - `email` → `email`

### Google Identity Broker

1. Create Google OAuth Client at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Set redirect URI: `https://<your-keycloak>/realms/<your-realm>/broker/google/endpoint`
3. Configure in Keycloak: Identity Providers → Add Google
4. Add mappers:
   - `email` → `email`

## Local Development

### DevServices (Automatic)

By default, authentication is **disabled** in the `dev` profile to simplify local development.

To enable OIDC and start Keycloak DevServices, run:

```bash
./mvnw quarkus:dev \
  -Dquarkus.oidc.enabled=true \
  -Dquarkus.keycloak.devservices.enabled=true
```

Test users are defined in `src/test/resources/devservices/keycloak-realm.json`, which is automatically imported.
Default users:
- `bruce` / `wayne` (Admin)
- `peter` / `parker` (Viewer)
- `miles` / `morales` (Client Role Admin)
- `gwen` / `stacy` (Client Role Viewer)

### External Keycloak (Manual)

For testing with an external Keycloak instance:

```bash
# Start Keycloak (use podman or docker)
podman run -d --name keycloak \
  -p 8190:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -e KC_HTTP_ENABLED=true \
  -e KC_HOSTNAME=localhost \
  quay.io/keycloak/keycloak:26.4 start-dev

# Start application (using 'quarkus' as example realm name)
./mvnw quarkus:dev \
  -Dquarkus.profile=external-idp \
  -Dquarkus.oidc.auth-server-url=http://localhost:8190/realms/quarkus \
  -Dquarkus.oidc.credentials.secret=example-credentials \
  -Dquarkus.keycloak.devservices.enabled=false
```

### Testing Script

An automated testing script is available for all authentication scenarios:

```bash
./scripts/test-auth.sh --help
```

The script supports DevServices Keycloak, external Keycloak (with optional GitHub/Google brokers), and direct Google OIDC.

#### Testing API Authentication

After running a scenario with Keycloak, test API authentication:

```bash
# 1. Get user token (uses bruce/wayne created by the script)
USER_TOKEN=$(curl -s -X POST \
  "http://localhost:8190/realms/quarkus/protocol/openid-connect/token" \
  -d "client_id=exploit-iq-client" \
  -d "client_secret=example-credentials" \
  -d "username=bruce" \
  -d "password=wayne" \
  -d "grant_type=password" \
  -d "scope=openid profile email" | jq -r '.access_token')

# 2. Verify token obtained
[ -n "$USER_TOKEN" ] && echo "Token obtained" || echo "Failed to get token"

# 3. Call API with Bearer token
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:8080/api/v1/reports
```

## User Display

The application resolves a display / actor name with this priority (`UserService`):

1. `email` claim (primary)
2. `upn` claim (User Principal Name)
3. `metadata.name` (OpenShift)
4. `preferred_username`
5. `sub`
6. `anonymous` (fallback)

For browser sessions, Quarkus may use UserInfo; for pure bearer M2M calls, the JWT principal name (`sub`, often the Cognito app client id) is typically used. Ensure your IdP includes `email` (or another claim above) for human users when you care about UI display names.

## Role Mapping

The application implements a **unified role mapping** strategy in `RoleMappingAugmentor`. On every authenticated request it inspects the JWT (and, for OpenShift `prod`, UserInfo-backed claims) and grants only roles that appear in the configured allow-list (`quarkus.http.auth.policy.role-policy.roles-allowed`, which includes human roles plus `exploitiq.security.service-account-roles`).

**Target human roles:**

- `exploit-iq-admin`: Admin access
- `exploit-iq-view`: Read-only access
- `exploit-iq-prodsec`: Product Security access

**Service-account style roles** (skip report owner checks when held): configured via `exploitiq.security.service-account-roles`, including OpenShift SA names and `exploitiq-api-access`.

### OpenShift Groups (`prod`)

OpenShift Groups from UserInfo / `groups` are mapped when the group name matches a target role:

- Group `exploit-iq-admin` → `exploit-iq-admin`
- Group `exploit-iq-view` → `exploit-iq-view`
- Group `exploit-iq-prodsec` → `exploit-iq-prodsec`

Kubernetes ServiceAccount JWTs may also map via the `kubernetes.io` claim / `sub` when configured in the allow-list.

### OIDC Roles (Keycloak / `external-idp` / `dev`)

- **Realm roles:** `realm_access.roles`
- **Client roles:** `resource_access.{client-id}.roles` for `exploit-iq-client`

### AWS Cognito (`external-idp`)

- **Browser / user tokens:** `cognito:groups` — each group name that matches a target role is granted (e.g. Cognito group `exploit-iq-admin` → role `exploit-iq-admin`).
- **M2M / `client_credentials` tokens:** no group claim; configure `exploitiq.security.oidc.scope-role-mappings` (env `EXPLOITIQ_SECURITY_OIDC_SCOPE_ROLE_MAPPINGS`) as `scope=role` pairs, e.g. `exploitiq-resource-server/exploitiq-api-access=exploitiq-api-access`.

When Cognito env vars and scope mappings are unset, Cognito-specific paths are no-ops; OpenShift and Keycloak behavior is unchanged.

## Troubleshooting

### User Shows as "anonymous"

**Cause:** Missing protocol mappers in Keycloak.

**Solution:** Add `email`, `preferred_username`, and `upn` mappers to the client scope.

### Redirect URI Mismatch

**Cause:** The redirect URI in the OAuth app doesn't match the application URL.

**Solution:**

- Ensure exact match including trailing slash: `https://your-app/`
- Changes may take 5-15 minutes to propagate

### API Returns 401 Unauthorized

**Cause:** Token missing `openid` scope or invalid token.

**Solution:**

1. Ensure `scope=openid profile email` is included in token request
2. Verify token is not expired
3. Check Keycloak logs for "Missing openid scope" error

### API Returns 403 Forbidden (authenticated but no role)

**Cause:** Token validated but no matching ExploitIQ role was mapped.

**Solution (Cognito browser):**

1. Confirm the user is in a Cognito group named exactly `exploit-iq-admin`, `exploit-iq-view`, or `exploit-iq-prodsec`
2. Confirm the **access** token contains `cognito:groups` with those names
3. Check logs for `Mapping user to role ... from source: Cognito Group`

**Solution (Cognito M2M):**

1. Set `EXPLOITIQ_SECURITY_OIDC_SCOPE_ROLE_MAPPINGS` to map your custom scope to `exploitiq-api-access`
2. Ensure the token `scope` claim contains that exact scope string
3. Check logs for `Mapping user to role ... from source: Cognito M2M Scope`

### Cognito: invalid_scope / Client is not enabled for OAuth2.0 flows

**Cause:** App client Hosted UI / OAuth settings incomplete.

**Solution:**

1. Enable Authorization code grant
2. Allow scopes `openid`, `email`, `profile` for browser clients
3. Set callback URLs to the exact app origin (with and without trailing `/`)
4. Ensure a Cognito domain exists and managed login status is Available

### Cognito: OIDC Server is not available / BadRequest on discovery

**Cause:** Wrong `QUARKUS_OIDC_AUTH_SERVER_URL`.

**Solution:** Use the issuer only:

`https://cognito-idp.{region}.amazonaws.com/{user-pool-id}`

Do **not** append `/.well-known/openid-configuration` (Quarkus adds it). Do **not** use the `{prefix}.auth.{region}.amazoncognito.com` Hosted UI domain as `auth-server-url`.

### Cognito: no cookies visible after login

**Cause:** Looking in the wrong place, or expecting a readable JWT cookie.

**Solution:** Quarkus sets an HttpOnly session cookie (often `q_session`) on the **application** origin. Check DevTools → Application → Cookies → `http://localhost:8080` (not the Cognito domain). `document.cookie` will not show HttpOnly cookies.

### HTTPS Required Error (Keycloak)

**Cause:** Keycloak 26.x requires HTTPS by default, even in development.

**Solution:** For local development, set `sslRequired=NONE` on the realm:

```bash
# Using kcadm.sh inside container
podman exec keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 --realm master --user admin --password admin
podman exec keycloak /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE
```

The testing script (`test-auth.sh`) handles this automatically.

### Enable Debug Logging

Add to `application.properties` or set as environment variable:

```properties
quarkus.log.category."io.quarkus.oidc".level=DEBUG
```

Or run the testing script with debug flag:

```bash
./scripts/test-auth.sh --debug
```

## Additional Resources

- [Quarkus OIDC Guide](https://quarkus.io/guides/security-openid-connect)
- [Quarkus OIDC Bearer Token Authentication](https://quarkus.io/guides/security-oidc-bearer-token-authentication)
- [Quarkus Configuring Well-Known OpenID Connect Providers](https://quarkus.io/guides/security-openid-connect-providers)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Amazon Cognito OAuth 2.0 / OIDC endpoints](https://docs.aws.amazon.com/cognito/latest/developerguide/federation-endpoints.html)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)