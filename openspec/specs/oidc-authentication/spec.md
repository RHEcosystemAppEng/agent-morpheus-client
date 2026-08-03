# oidc-authentication Specification

## Purpose
Define how ExploitIQ maps OIDC identity-provider JWT claims to application roles across OpenShift OAuth, Keycloak, and AWS Cognito (browser login and M2M), including non-regression guarantees for existing IdP paths.
## Requirements
### Requirement: AWS Cognito browser login role mapping

`RoleMappingAugmentor` SHALL extract application roles from the `cognito:groups` claim (a JSON array of group names) on the identity's JWT, in addition to the existing `groups` (OpenShift), `realm_access.roles`/`resource_access.{client-id}.roles` (Keycloak), and Kubernetes service-account (`kubernetes.io`) claim checks. For each value in `cognito:groups` that matches a configured target role (`quarkus.http.auth.policy.role-policy.roles-allowed`), the augmentor SHALL grant that role to the identity, without duplicating roles already granted by another claim path. This claim check SHALL run unconditionally alongside the existing checks on every authenticated request, requiring no new Quarkus profile: the `external-idp` profile's existing `discovery-enabled=true`, `roles.source=accesstoken`, and `application-type=hybrid` settings SHALL work unmodified against a Cognito User Pool's `.well-known/openid-configuration`.

#### Scenario: Cognito group matching a target role is granted

- **WHEN** an authenticated request carries a JWT with `cognito:groups` containing `exploit-iq-admin`
- **AND** `exploit-iq-admin` is present in the configured target roles
- **THEN** the augmented identity is granted the `exploit-iq-admin` role

#### Scenario: Cognito group not matching any target role is ignored

- **WHEN** an authenticated request carries a JWT with `cognito:groups` containing a group name that is not in the configured target roles
- **THEN** the augmented identity is not granted a role for that group name
- **AND** no error is raised

#### Scenario: Missing cognito:groups claim does not affect other providers

- **WHEN** an authenticated request carries a JWT without a `cognito:groups` claim
- **THEN** the augmentor skips Cognito group role mapping
- **AND** continues to evaluate `groups`, `realm_access`/`resource_access`, and `kubernetes.io` claim paths unaffected

### Requirement: AWS Cognito M2M scope-to-role mapping

`RoleMappingAugmentor` SHALL support authorizing AWS Cognito `client_credentials` (M2M) bearer tokens, which carry no group claim, by mapping the token's OAuth2 `scope` claim (a space-delimited string) to application roles using a configurable `exploitiq.security.oidc.scope-role-mappings` property (a map of scope value to role name, empty by default). For each configured mapping whose scope value is present in the token's `scope` claim, the augmentor SHALL grant the mapped role, provided that role is also present in the configured target roles. This mechanism SHALL be provider-agnostic (keyed only on the standard `scope` claim), opt-in via configuration, and SHALL NOT alter role resolution for tokens where `exploitiq.security.oidc.scope-role-mappings` is unset or the `scope` claim is absent.

#### Scenario: M2M token scope matching a configured mapping is granted the mapped role

- **WHEN** an authenticated request carries a JWT with a `scope` claim containing `exploitiq-resource-server/exploitiq-api-access`
- **AND** `exploitiq.security.oidc.scope-role-mappings` maps `exploitiq-resource-server/exploitiq-api-access` to `exploitiq-api-access`
- **AND** `exploitiq-api-access` is present in the configured target roles
- **THEN** the augmented identity is granted the `exploitiq-api-access` role

#### Scenario: M2M token without a matching configured scope mapping is not granted a role

- **WHEN** an authenticated request carries a JWT with a `scope` claim that does not match any configured `exploitiq.security.oidc.scope-role-mappings` entry
- **THEN** no role is granted via scope-based mapping
- **AND** the request is still evaluated against roles granted by other claim paths

#### Scenario: Cognito M2M token is authorized to call the API

- **WHEN** the `exploit-iq-agent` service calls the `exploit-iq-client` API with a bearer token obtained from Cognito's token endpoint via `client_credentials` grant, whose `scope` claim matches a configured `exploitiq-api-access` mapping
- **THEN** the request is authorized by the global `role-policy` (which allows `exploitiq-api-access`)
- **AND** the caller identity resolves to the JWT `sub` claim (the Cognito App Client ID) for actor attribution, since no `UserInfo` is available for M2M requests

### Requirement: Existing OpenShift and Keycloak role mapping unaffected

Adding AWS Cognito claim support SHALL NOT change role resolution behavior for OpenShift OAuth (`prod` profile, `groups`/`userinfo` roles source) or Keycloak (`external-idp`/`dev` profiles, `realm_access`/`resource_access` roles source) identities. The new `cognito:groups` and `scope`-based checks SHALL be no-ops when their respective claims or configuration are absent.

#### Scenario: OpenShift identity unaffected by Cognito support

- **WHEN** an authenticated request carries an OpenShift JWT/UserInfo with a `groups` claim and no `cognito:groups` or matching `scope` mapping
- **THEN** roles are granted exactly as before this change, via the `groups` claim path only

#### Scenario: Keycloak identity unaffected by Cognito support

- **WHEN** an authenticated request carries a Keycloak JWT with `realm_access.roles` and/or `resource_access.{client-id}.roles` and no `cognito:groups` claim
- **THEN** roles are granted exactly as before this change, via the Keycloak claim paths only

