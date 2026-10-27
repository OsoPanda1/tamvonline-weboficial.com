# TAMV ID — Identity providers and verified ORCID runbook

**Scope:** Auth0 email signup/login, GitHub social connection through Auth0, ORCID-first registration handoff via direct ORCID OAuth, and authenticated ORCID linking for existing TAMV members.  
**Status:** code paths are present; production operation depends on provider credentials, callback configuration, migration deployment and end-to-end tests.

## 1. Email signup and login

TAMV uses Auth0 Authorization Code + PKCE. TAMV does not store user passwords. Configure the Auth0 tenant with a database/email connection and email verification. Register these URLs separately for every staging/production environment:

- Callback: APP_BASE_URL/api/auth/callback
- Logout return URL: APP_BASE_URL
- Allowed web origin: APP_BASE_URL

APP_BASE_URL must be the canonical HTTPS origin in production. Do not reuse another hostname's callback configuration.

## 2. GitHub authentication

1. Enable a GitHub social connection in Auth0, backed by a GitHub OAuth application supported by the tenant.
2. Set the GitHub OAuth application's callback to the exact Auth0 callback URL shown by Auth0 (not the TAMV callback).
3. Enable the connection for the TAMV Auth0 application and test subject, email and email_verified claims.
4. Set the server-only AUTH0_GITHUB_CONNECTION to the Auth0 connection name, not a GitHub secret or profile URL.
5. Request only identity/email scopes needed for signup. TAMV does not need private repository or organization-administration access just to authenticate members.
6. Test signup, returning login, consent cancellation, missing/unverified email, logout, expired session, callback mismatch and state/nonce/PKCE failure.

If the connection name is blank, the page says GitHub is not configured; the app does not pretend the provider is active.

## 3. ORCID: initial registration or later linking

### Optional ORCID login through Auth0 OIDC

This requires a functioning upstream OIDC connection in Auth0 and AUTH0_ORCID_CONNECTION. Setting that environment variable alone does not create or validate the connection. ORCID may not provide a verified email that meets TAMV's membership policy, so a researcher may need to register by email/GitHub first and link ORCID afterwards.

### Direct ORCID OAuth verification before registration and linking to TAMV ID

1. Obtain ORCID OAuth credentials for the application from the ORCID registry.
2. Register the exact HTTPS redirect URI: APP_BASE_URL/api/orcid/callback.
3. Set server-only ORCID_CLIENT_ID and ORCID_CLIENT_SECRET.
4. Apply supabase/migrations/202610270004_orcid_verified_link.sql to the correct Supabase project.
5. Test that the member has the same Auth0 session before and after consent; the callback checks OAuth state and session subject.
6. Test server-side code exchange, ORCID checksum validation, the canonical ORCID ID stored as verified and the absence of stored access tokens.
7. Test cancellation, invalid state, session change, malformed IDs, duplicate verified IDs, provider outage and database errors.

The direct linking and ORCID-first flows request the `/authenticate` scope to obtain the ORCID iD. They do not retrieve publications by default. A manually typed ORCID remains “declared”; only successful server-side OAuth linking should change it to “verified”.

Official guidance:
- https://info.orcid.org/documentation/integration-guide/authorization/
- https://info.orcid.org/documentation/integration-guide/

## 4. Privacy and account ownership

- Auth0 is the login identity; TAMV ID is a separate platform identifier.
- Social login does not verify degrees, affiliation, authorship or expertise.
- Do not request GitHub repository scopes to “prove” programming skill.
- Verified ORCID means that the identifier was authenticated through OAuth; it is not a quality certification for linked works.
- Keep OAuth client secrets and Supabase server keys on the server, never in NEXT_PUBLIC_ variables.
- Profiles stay private until the member consents to publication and the profile is approved.
- If an ORCID is already verified on another TAMV ID, stop and investigate; do not overwrite the other link.
- Before registration opens, verify the real data controller, privacy contact, notice/retention policy, migration and deletion handling.

## 5. Go-live checklist

- [ ] Auth0 domain/client credentials and a strong AUTH0_SECRET are configured.
- [ ] Email signup, verification mail and login round-trip pass in a browser.
- [ ] GitHub upstream connection is configured in Auth0 and callbacks are registered.
- [ ] Optional Auth0/ORCID OIDC sign-in, if used, is tested independently.
- [ ] Direct ORCID OAuth credentials and exact callback are registered.
- [ ] Test ORCID-first onboarding: OAuth authentication, pending-cookie handoff, Auth0 signup/email verification, TAMV profile save, successful linking, cancellation and expiry.
- [ ] Test ORCID linking from an existing authenticated profile and prevent duplicate-account/cross-member linking.
- [ ] Migration 004 is applied and its function/index verified in Supabase.
- [ ] Duplicate ORCID linking and cross-member linking are tested.
- [ ] TAMV_REGISTRATION_ENABLED remains false until legal/data-controller gates are signed off.
- [ ] Build/type checks and browser tests pass.
- [ ] Provider errors do not expose authorization codes or tokens in logs.
- [ ] The production deployment and canonical domain are verified separately.

The repository contains the integration paths; it does not contain private Auth0/ORCID credentials and cannot enable upstream provider connections by code alone.
