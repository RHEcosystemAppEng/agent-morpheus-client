# Authentication

This guide covers authentication configuration for ExploitIQ Client, including OpenShift OAuth, external identity providers, and development setups.

## Overview

ExploitIQ supports multiple authentication modes via Quarkus profiles:

| Profile | Use Case | Identity Provider |
|---------|----------|-------------------|
| `prod` | OpenShift | OpenShift OAuth |
| `external-idp` | External identity providers | Keycloak, Google, Azure AD, Okta |
| `dev` | Local development | Keycloak DevServices |

### Authentication Methods

All profiles support both browser and API authentication:

| Method | Use Case | Flow |
|--------|----------|------|
| Browser | Web UI | Authorization Code Flow (redirects to IdP) |
| API | CLI, scripts, services | Bearer JWT token in `Authorization` header |

**Token acquisition differs by profile:**

- `prod` (OpenShift): Use `oc whoami -t` or ServiceAccount tokens
- `external-idp` (Keycloak): Use OIDC token endpoint with password grant
- `dev`: Same as `external-idp` (DevServices Keycloak)

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

### Other OIDC Providers

The same approach works with any OIDC-compliant provider:

| Provider | Auth Server URL |
|----------|-----------------|
| Azure AD | `https://login.microsoftonline.com/{tenant}/v2.0` |
| Okta | `https://dev-xxxxx.okta.com/oauth2/default` |
| Auth0 | `https://your-domain.auth0.com` |
| AWS Cognito | `https://cognito-idp.{region}.amazonaws.com/{userPoolId}` |

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

For machine-to-machine communication, use the client credentials grant:

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

Quarkus automatically starts Keycloak via DevServices:

```bash
./mvnw quarkus:dev
```

Test users are pre-configured in `application.properties`:

```properties
%dev.quarkus.keycloak.devservices.users.bruce=wayne
%dev.quarkus.keycloak.devservices.users.peter=parker
```

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

The application displays user information with this priority:

1. `email` claim (primary)
2. `upn` claim (User Principal Name)
3. `metadata.name` (OpenShift)
4. `anonymous` (fallback)

Ensure your identity provider or Keycloak is configured to include the `email` claim in tokens.

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
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
