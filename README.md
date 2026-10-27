# TAMV Online Network — Institutional Research Platform

A Next.js App Router site for TAMV Online Network, with a documented institutional profile, public research catalogue, member identity registry (TAMV ID), research metadata discovery and a preliminary intellectual-property workflow.

> **Evidence policy:** a website, identifier, DOI, repository entry, citation count or patent search result does not by itself prove peer review, technical function, organizational eligibility, patentability, authorship ownership, commercial value or legal compliance. Each claim must keep its source and scope.

## Main capabilities

- Institutional identity: mission, vision, founder profile, purpose, areas of work, membership, governance and editorial principles.
- TAMV ID: Auth0-based sign-in, private-by-default profile and Supabase-backed persistent identifier registry. TAMV ID is internal to this platform and is not a replacement for ORCID, ISNI, DOI or government identity.
- Public discovery: catalogue, research/publication index, resource directory and contributor guide.
- Federated research search: public metadata search through OpenAlex, Crossref, DataCite, OpenAIRE Graph and PubMed/NCBI, plus ROR organization lookup.
- DOI metadata audit: compares Crossref, DataCite and OpenAlex records, returns per-provider states, shows missing metadata and calculates an evidence-readiness/transfer-triage score.
- IP discovery: EPO Open Patent Services searches when server-side credentials are configured, plus official manual links to USPTO, WIPO PATENTSCOPE, Espacenet and Google Patents.
- Optional provenance snapshots: SHA-256 of the exact generated DOI-audit JSON and optional persistence in Supabase for a registered TAMV member.
- Automated source checks and production build through GitHub Actions.

## Stack

- Next.js 16 / React 19 / TypeScript
- Native server-side fetch for public metadata APIs and Supabase REST
- Auth0 OIDC Authorization Code + PKCE for identity
- Supabase Postgres for TAMV ID/member data and optional research audit snapshots
- Vercel deployment configuration and GitHub Actions quality gates
- No new third-party client dependencies for the research workspace

## Key paths

- app/page.tsx: institutional homepage.
- app/auditoria/page.tsx: federated research search, DOI audit, patent/IP panel, API map and Isabella triage display.
- app/investigacion/page.tsx: public record index with explicit source-evidence boundaries.
- app/api/research/search/route.ts: OpenAlex, Crossref, DataCite, OpenAIRE, PubMed/NCBI and ROR search adapters.
- app/api/research/audit/route.ts: DOI metadata comparison, SHA-256 digest and optional Supabase snapshot.
- app/api/research/patents/route.ts: EPO OPS OAuth connector plus official manual IP-search links.
- lib/research-engine.ts: DOI normalization and deterministic evidence-readiness model.
- lib/supabase-rest.ts: server-only Supabase access, member registry and research snapshot persistence.
- supabase/migrations/202610270001_tamv_identity_registry.sql: TAMV ID/member/identifier tables.
- supabase/migrations/202610270002_research_audit_snapshots.sql: private research audit snapshots.
- supabase/tests/tamv_identity_registry_checks.sql: read-only checks of member-table RLS and grants.
- docs/tamv-id-runbook.md: Auth0, Supabase and TAMV ID setup.
- docs/research-audit-api-map.md: connector/API map, data access limits, evidence-scoring weights and IP boundaries.
- .env.example: variable names and safe configuration notes, without real credentials.
- .github/workflows/site-quality.yml: static validation, TypeScript and build gates.

## Run locally

Prerequisites: Node.js 22 and pnpm 12.3.4 (aligned with the repository's package manager declaration).

Run pnpm install --frozen-lockfile, then pnpm dev.

Quality checks: pnpm validate:app, pnpm typecheck and pnpm build.

The static App validator is source inspection, not a runtime/API test. Browser workflows, external API behavior, legal review and production deployment must be checked separately.

## Public research API connectors

| Provider | Status in this app | Notes |
|---|---|---|
| OpenAlex | Active public metadata query | Data coverage and citations depend on provider records. |
| Crossref | Active public metadata query | Publisher/registrant deposit metadata; not a peer-review verdict. |
| DataCite | Active public DOI query | Public API exposes Findable records. |
| OpenAIRE Graph | Active public metadata search | Up to 8 results per request; public API rate limits and field coverage apply. |
| PubMed / NCBI | Active metadata search via E-utilities | Metadata only; not clinical advice or bulk full-text retrieval. Optional NCBI API key. |
| ROR | Active organization lookup | Search result does not establish eligibility for a ROR ID. |
| ORCID / OSF | Linked/documented, not automatically queried in this release | API credentials, OAuth, scope and permission review required. |
| Dimensions | Link/documentation only | Analytics API access and intended usage depend on subscription/entitlement. |
| Lounge.ai | Public source links only | Market data and benchmarks are provider-reported; no general-purpose API connector is active in this build. |
| EPO OPS | Optional server-side connector | Requires EPO_OPS_KEY and EPO_OPS_SECRET from a registered app. |
| USPTO ODP | Link-only/pending adapter | Requires API key and an enabled, validated endpoint. This build does not claim automated general patent search there. |
| WIPO PATENTSCOPE | Manual portal link only | WIPO terms prohibit automated search queries and scraping. |
| Google Scholar | Manual link only | No scraping. |
| Scopus / Web of Science | Not connected | API products may require an application, subscription and entitlement. |

The API map and official documentation links live in docs/research-audit-api-map.md.

## Supabase setup

Apply migrations in order to the correct Supabase project:

1. supabase/migrations/202610270001_tamv_identity_registry.sql
2. supabase/migrations/202610270002_research_audit_snapshots.sql

Then run the repository's Supabase read-only security check using the SQL Editor or an authorized CLI connection:

supabase/tests/tamv_identity_registry_checks.sql

The application uses a server-only key. Never expose SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY via NEXT_PUBLIC_*, client components, browser requests or commits.

Research audit persistence remains disabled by default. Set TAMV_RESEARCH_AUDIT_PERSISTENCE_ENABLED=true only after migration 002 is applied, RLS/grants are verified and the retention/access policy has been reviewed. A GitHub commit does not apply migrations to the external Supabase database.

## Auth0 and optional EPO setup

- Auth0 is an OIDC identity provider; the application session is separate from the profile record.
- Configure exact callback/logout URLs as documented in docs/tamv-id-runbook.md.
- Add EPO OPS credentials as server-only Vercel environment variables to enable the current title-search connector.
- Do not add API keys to source control or share them through issue text or browser code.
- The USPTO ODP key is reserved as a documented environment variable only; automatic general patent search is not enabled in this build.

## Isabella evidence / transfer triage

The model is deterministic and transparent. It weighs:

- Metadata completeness: 30%
- Reproducibility documentation: 25%
- Rights/license evidence: 20%
- External review evidence: 15%
- Documented IP review: 10%

This is an **evidence-readiness/next-actions index**. It is not a scientific quality score, impact factor, patent valuation, market price, ROI, freedom-to-operate opinion, patentability opinion or promise of commercialization. The UI deliberately treats unrecorded evidence as undocumented rather than claiming that the activity never occurred.

## Security, privacy and legal boundaries

- Member profiles are private by default; public resolution requires express consent and approval.
- External API results are sourced from the providers and accompanied by retrieval date/status; empty/provider-unavailable states must not be conflated.
- The SHA-256 digest detects changes only when the exact snapshot is compared; it is not a trusted timestamp or a qualified electronic signature.
- Review patent status and rights in official registers and involve qualified counsel before legal, filing, investment or shipping decisions.
- Privacy notice and registration remain subject to actual controller/contact configuration and legal review.
- The presence of TAMV Online Network or its documents does not prove legal personality, external institutional recognition, ROR eligibility, peer review or independent endorsement.

## ROR preparation

ROR eligibility is a separate decision by ROR. TAMV ID is an internal member identifier and does not create or confer a ROR ID. Before any request, document the actual collective entity, stable public identity, research activity, multiple contributors where applicable and publicly identifiable outputs that acknowledge the entity accurately. Do not invent affiliations, collaborators or output metadata to satisfy criteria. Consult ROR official documentation at https://ror.readme.io/docs/rest-api and current eligibility/request guidance before submitting.

## License

No general software/content license is declared by this README. Do not assume public-domain status or unrestricted reuse. Add a license only after the rights holder has chosen and verified its scope.
