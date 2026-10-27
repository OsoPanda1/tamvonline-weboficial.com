# TAMV ID — implementation and launch runbook

Version: 1.0.0  
Date: 27 October 2026  
Scope: Next.js App Router, Auth0 OIDC login, Supabase Postgres registry, TAMV ID resolver.

## Architecture

- **Auth0** is the identity provider. The Next.js server completes an Authorization Code + PKCE flow, checks the OIDC ID token signature using the tenant JWKS, and verifies issuer, audience, expiry, state and nonce.
- **TAMV ID** is a separate platform-level identifier assigned by a PostgreSQL trigger. It is not an ORCID, ISNI, DOI, government identifier or academic accreditation.
- **Supabase Postgres** stores the member profile, consent versions, declared external identifiers and a pseudonymous retirement record for withdrawn TAMV IDs.
- **Vercel** runs the Next.js application and supplies server-only variables.
- The Supabase Data API is called from server modules using `fetch` and a server-only Supabase key. No service key is sent to a browser. Tables have RLS enabled and public/anon/authenticated table privileges revoked; only the server service role can execute the registration/deletion RPCs.
- **No account or profile is created by client-side JavaScript alone.** A verified Auth0 session, explicit consent and server-side validation are required.

## Routes in the live Next.js App Router

- `/registro`: identity entry and consent-based member profile registration.
- `/cuenta`: private account summary and profile deletion control.
- `/miembro/TAMV-...`: resolver that displays only approved, public, consented profiles.
- `/resolver`: public ID lookup entry.
- `/membresia`: membership offer and non-guaranteed benefits.
- `/privacidad` and `/terminos`: versioned legal information.
- `/catalogo`, `/recursos`, `/politica-editorial`, `/contribuir`: institutional discovery, governance and contribution pages.
- `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`, `/api/auth/session`: Auth0 OIDC session flow.
- `/api/members/register`, `/api/members/me`, `/api/members/TAMV-...`: protected registration, private profile management and public resolver API.

## Required deployment configuration

Configure variables in Vercel; never place values in source control or a `NEXT_PUBLIC_*` variable unless the value is explicitly intended to be public.

| Variable | Purpose |
|---|---|
| `AUTH0_DOMAIN` | Auth0 tenant hostname only, e.g. `tenant.us.auth0.com`; no path |
| `AUTH0_CLIENT_ID` | Auth0 Regular Web Application client ID |
| `AUTH0_CLIENT_SECRET` | Auth0 client secret |
| `AUTH0_SECRET` | At least 32 bytes, used to encrypt the application session and OAuth transaction cookies |
| `APP_BASE_URL` | Canonical HTTPS production origin, normally `https://tamv.online` |
| `SUPABASE_URL` | Supabase project URL; `NEXT_PUBLIC_SUPABASE_URL` is accepted only as URL fallback |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Server-only key used by API routes and RPCs |
| `TAMV_DATA_CONTROLLER_NAME` | Actual responsible party name, not a placeholder |
| `TAMV_DATA_CONTROLLER_ADDRESS` | Actual domicile/address required for the launch privacy notice |
| `TAMV_PRIVACY_CONTACT_EMAIL` | Monitored privacy and rights-request channel |
| `TAMV_REGISTRATION_ENABLED` | Keep `false` until all launch controls pass; set `true` only after sign-off |

Example: generate the Auth0 session secret with `openssl rand -hex 32`. Do not reuse a database password, access token or source-control token as the Auth0 secret.

## Auth0 dashboard setup

Create or use a **Regular Web Application**. Configure the exact production URLs:

- Allowed Callback URLs: `https://tamv.online/api/auth/callback`
- Allowed Logout URLs: `https://tamv.online`
- Allowed Web Origins: `https://tamv.online`

For local testing, add `http://localhost:3000/api/auth/callback` and `http://localhost:3000`. For Vercel previews, explicitly register approved preview callback/logout URLs or use a dedicated staging domain and Auth0 application. The implementation uses the Auth0 domain's OIDC JWKS and only accepts RS256-signed tokens. Verify that the tenant/application issues RS256 ID tokens and that the email is verified before registering a TAMV ID.

## Supabase migration — must be applied before activating registrations

File: `supabase/migrations/202610270001_tamv_identity_registry.sql`.

1. Open the correct Supabase project.
2. Review the migration in source control.
3. Apply it using the Supabase CLI migration workflow or SQL Editor in the project.
4. Confirm the tables/functions exist: `tamv_id_registry`, `tamv_members`, `tamv_member_identifiers`, `tamv_register_member`, `tamv_delete_member`.
5. Confirm RLS is enabled and public/anon/authenticated privileges are revoked for the registry and private member tables.
6. Verify the service key has server access to the Data API and the RPC functions.
7. Run the database security review before launch. Do not copy a service-role/secret key into client code.

The migration is present in GitHub, but it has **not** been applied to the connected Supabase database from this repository operation. A repository commit cannot confirm or perform an external database migration without authorized database access.

## TAMV ID and review workflow

- The database generates `TAMV-` followed by 26 uppercase hexadecimal characters from a cryptographically generated UUID value. A unique constraint and registry table prevent ID reuse.
- The Auth0 subject is a private internal key and must never appear in the public profile.
- Email verification is not civil-identity verification. ORCID/ISNI entries are format/checksum validated during registration but remain **declared**, not ownership-verified.
- Every submitted member starts as `pending_review`. Registration does not auto-approve a member or make a public profile visible.
- An authorized human reviewer must separately approve a member. Publishing additionally requires profile visibility to be public and the recorded express consent to remain true.
- Public resolution returns only a profile with `membership_status = 'approved'`, `profile_visibility = 'public'` and `public_profile_consent = true`.
- Deletion removes the member's profile and its identifier links from the TAMV database, then leaves a withdrawn ID tombstone without profile data to prevent reassignment. The Auth0 identity is managed by Auth0 separately and is not deleted by this app route.

Approval is intentionally not exposed as a public endpoint. It should be performed by a designated reviewer through an authenticated administrative procedure after establishing the actual governance process. Do not give general members a way to write `membership_status`.

## Legal/privacy gate

The registration API returns 503 unless `TAMV_REGISTRATION_ENABLED=true` and actual values are provided for `TAMV_DATA_CONTROLLER_NAME`, `TAMV_DATA_CONTROLLER_ADDRESS` and `TAMV_PRIVACY_CONTACT_EMAIL`. This is deliberate: a production registration flow should not collect personal data while the responsible party and privacy-request channel are placeholders.

Before enabling:
- Confirm the correct controller name and real address, retention policy, legal basis and transfers/subprocessors.
- Review Auth0, Supabase and Vercel data processing terms and regional settings.
- Have the privacy notice and terms reviewed against the current law and actual operational setup.
- Verify how ARCO/rights requests are received, identity-checked, tracked and fulfilled.
- Confirm the account deletion workflow and the separately managed Auth0 identity retention process.
- Ensure no analytics or cookies are described inaccurately; the current profile flow does not use client-side Supabase Auth or a browser-exposed service key.

Official legal reference (Mexico): [Ley Federal de Protección de Datos Personales en Posesión de los Particulares — Cámara de Diputados](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf). The legal pages are an operational starting point, not a certification of compliance or substitute for legal review.

## ROR readiness boundary

TAMV ID is an internal member-identity record. It does not create a Research Organization Registry (ROR) entry, validate a legal entity, or by itself establish organizational eligibility. ROR's criteria must be reviewed independently, including the collective/stable nature of the entity and identifiable research outputs that acknowledge it accurately. Do not fabricate affiliations, collaborators or outputs to meet criteria.

## Pre-launch test checklist

- [ ] The SQL migration ran successfully in the correct Supabase project.
- [ ] RLS is enabled; no public table grants exist for private member records.
- [ ] Auth0 callback/logout URLs are exact and authentication round-trip succeeds on production/staging.
- [ ] Invalid state, wrong nonce, wrong audience, expired token, non-RS256 token and unverified email are rejected.
- [ ] Missing consent, missing adult confirmation, invalid ORCID/ISNI checksum, invalid URLs, oversized input and invalid country code are rejected.
- [ ] Multiple registrations for the same Auth0 subject update one record rather than minting another ID.
- [ ] Public profiles stay hidden until human approval and explicit opt-in.
- [ ] The resolver does not reveal private, pending, suspended, rejected or withdrawn profiles.
- [ ] Profile deletion removes user profile/identifier data while preventing ID reuse.
- [ ] Requests cannot update another member by changing an ID in the body; API routes derive Auth0 subject only from the encrypted session.
- [ ] Privacy controller values are reviewed and `TAMV_REGISTRATION_ENABLED` stays false until sign-off.
- [ ] TypeScript, static site checks, App Router checks and the production build all pass.
- [ ] Verify behavior in a browser and confirm production deployment separately.
