# TAMV Online Network — Institutional Research Platform

A Next.js App Router site for TAMV Online Network, with a documented institutional profile, VETRA Ω∞ proposal screening and governance framework, TAMV Ω∞ HCU transformation map, institutional roadmap, public research catalogue, member identity registry (TAMV ID), federated research metadata discovery, verified ORCID linking and a preliminary intellectual-property workflow.

> **Evidence policy:** a website, identifier, DOI, repository entry, citation count or patent search result does not by itself prove peer review, technical function, organizational eligibility, patentability, authorship ownership, commercial value or legal compliance. Each claim must keep its source and scope.

## Main capabilities

- Institutional identity: mission, vision, founder profile, purpose, areas of work, membership, governance and editorial principles.
- TAMV ID: Auth0 Authorization Code + PKCE sign-in/signup, private-by-default profile editing/prefill and Supabase-backed persistent identifier registry. Email signup/login depends on the configured Auth0 email connection. GitHub authentication is available through a separately enabled Auth0 social connection. ORCID supports an OAuth-first registration handoff followed by Auth0 verified-email signup/login, as well as linking from an existing account. A manually typed ORCID remains declared, not verified. TAMV ID is not a replacement for ORCID, ISNI, DOI or government identity.
- Public discovery: catalogue, research/publication index, searchable researcher/developer directory, resource directory and contributor guide. The canonical route is `/miembros`; it only shows approved profiles with explicit public-profile consent. `/comunidad` redirects to `/miembros` for compatibility.
- Federated research search: public metadata search through OpenAlex, Crossref, DataCite, OpenAIRE Graph and PubMed/NCBI, plus ROR organization lookup.
- DOI metadata audit: compares Crossref, DataCite and OpenAlex records, returns per-provider states, shows missing metadata and calculates an evidence-readiness/transfer-triage score.
- IP discovery: EPO Open Patent Services searches when server-side credentials are configured, plus official manual links to USPTO, WIPO PATENTSCOPE, Espacenet and Google Patents.
- Optional provenance snapshots: SHA-256 of the exact generated DOI-audit JSON and optional persistence in Supabase for a registered TAMV member.
- VETRA Ω∞: three mandatory gates (integrity/provenance; method/reproducibility; responsibility/rights/impact), fourteen evaluation domains, human review, conflict declarations, appeals and an institutional roadmap.
- VETRA proposal intake: server-side validation and private Supabase tables for proposals, reviews and decisions. The intake is disabled until migration, privacy/retention policy and governance are approved.
- TAMV Ω∞ HCU: interactive transformation-map concept with six domains, 25 initial nodes, 7 multi-entity hyperedges, search, risk/evidence views, temporal exploration, local-only Cognitive Pod simulation, federated literature metadata search, SHA-512 snapshot digest export and local snapshot digest verification. HCU axis values and scenarios remain explicitly illustrative; the digest is not a signature, trusted timestamp, BookPI root or certification.
- Executive brief, canonical VETRA regulations, quantitative metrics/use cases, technical English foundations and roadmap documents.
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
- app/components/site-header.tsx: shared responsive navigation with keyboard-operable details-based dropdown menus and session-aware account/signup actions.
- app/miembros/page.tsx and app/miembros/member-directory.tsx: canonical searchable public researcher directory, backed only by approved, consented member profiles and verified identifiers.
- app/comunidad/page.tsx: legacy route that redirects to `/miembros`.
- app/auditoria/page.tsx: federated research search, DOI audit, patent/IP panel, API map and Isabella triage display.
- app/investigacion/page.tsx: public record index with explicit source-evidence boundaries.
- app/hcu/page.tsx: public HCU transformation-universe page.
- app/miembros/page.tsx: public directory of real approved profiles; shows an honest empty state when no public profiles exist.
- app/miembros/member-directory.tsx: searchable/filterable directory of consented profiles and verified external links.
- app/hcu/hcu-universe.tsx: interactive canvas, selected-node inspector, local simulation controls, metadata lookup, JSON snapshot export and browser-local SHA-512 digest verification. Digest matching only confirms the snapshot bytes under the stated serialization rule; it does not prove authorship or claim validity.
- lib/hcu-model.ts: six domains, initial entity seeds, hyperedge hypotheses and public research catalog links.
- app/api/orcid/connect/route.ts and app/api/orcid/callback/route.ts: ORCID OAuth-first registration handoff and authenticated member linking; secrets remain server-side.
- app/api/orcid/pending/route.ts: cancel the short-lived ORCID-first handoff.
- app/api/members/register/route.ts: authenticated member/profile upsert, consent validation and ORCID-ownership checks.
- app/api/research/search/route.ts: OpenAlex, Crossref, DataCite, OpenAIRE, PubMed/NCBI and ROR search adapters.
- app/api/research/audit/route.ts: DOI metadata comparison, SHA-256 digest and optional Supabase snapshot.
- app/api/research/patents/route.ts: EPO OPS OAuth connector plus official manual IP-search links.
- lib/research-engine.ts: DOI normalization and deterministic evidence-readiness model.
- lib/supabase-rest.ts: server-only Supabase access, member registry and research snapshot persistence.
- supabase/migrations/202610270001_tamv_identity_registry.sql: TAMV ID/member/identifier tables.
- supabase/migrations/202610270002_research_audit_snapshots.sql: private research audit snapshots.
- supabase/migrations/202610270003_vetra_proposals_reviews.sql: private VETRA proposals, reviewer assessments and human decisions.
- supabase/migrations/202610270004_orcid_verified_link.sql: server-only RPC and uniqueness controls for an ORCID authenticated via OAuth.
- supabase/tests/vetra_review_security_checks.sql: read-only grants/RLS checks for VETRA tables.
- supabase/tests/tamv_identity_registry_checks.sql and supabase/tests/vetra_review_security_checks.sql: read-only checks of member-table RLS and grants.
- docs/tamv-id-runbook.md: Auth0, Supabase and TAMV ID setup.
- docs/identity-providers-runbook.md: GitHub/Auth0 connection, email signup and direct ORCID OAuth configuration and tests.
- docs/hcu-methodology.md: HCU evidence model, hyperedge requirements, snapshot digest semantics and prototype boundaries.
- docs/research-audit-api-map.md: connector/API map, data access limits, evidence-scoring weights and IP boundaries.
- docs/vetra-executive-brief.md: executive brief and governance decision requested.
- docs/CANON-VETRA-OMEGA-INFINITY-2026-V1.0.md: canonical regulations and the three-gate framework.
- docs/vetra-metrics-and-use-cases.md: scoring rubric, process metrics and AI use cases.
- docs/vetra-foundations-en.md: technical English translation of the philosophical foundations.
- docs/roadmap-institutional-2026-2028.md: phased institutional and commercial roadmap.
- .env.example: variable names and safe configuration notes, without real credentials.
- .github/workflows/site-quality.yml: static validation, TypeScript and build gates.

## Run locally

Prerequisites: Node.js 22 and pnpm 12.3.4 (aligned with the repository's package manager declaration).

Run pnpm install --frozen-lockfile, then pnpm dev.

Quality checks: pnpm validate:app, pnpm typecheck and pnpm build.

The static App validator is source inspection, not a runtime/API test. Browser workflows, external API behavior, legal review and production deployment must be checked separately. Auth0 GitHub connections and ORCID OAuth credentials require configuration in their respective provider portals; no credentials are committed.

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
3. supabase/migrations/202610270003_vetra_proposals_reviews.sql

Then run the repository's Supabase read-only security check using the SQL Editor or an authorized CLI connection:

supabase/tests/tamv_identity_registry_checks.sql

The application uses a server-only key. Never expose SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY via NEXT_PUBLIC_*, client components, browser requests or commits.

Research audit persistence and VETRA proposal intake remain disabled by default. Enable `TAMV_VETRA_SUBMISSIONS_ENABLED=true` only after migration 003 is applied, RLS/grants are verified, VETRA's privacy/retention policy is approved, and the committee/appeal process is documented. Set TAMV_RESEARCH_AUDIT_PERSISTENCE_ENABLED=true only after migration 002 is applied, RLS/grants are verified and the retention/access policy has been reviewed. A GitHub commit does not apply migrations to the external Supabase database.

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

## VETRA Ω∞ proposal review

VETRA is an internal pilot framework, not an accredited certification body. Proposal intake has three gates: (1) integrity and provenance, (2) method and reproducibility, and (3) responsibility, rights, security and impact. A self-declaration is not a review result. Critical failures cannot be compensated by an aggregate score; all substantive decisions require accountable human review. Payment or membership tier never purchases a favorable assessment.

Review policies, weights and proposed thresholds are versioned in the VETRA documents. Numeric thresholds are pilot hypotheses and require calibration before use for high-impact decisions. Seven human reviewers and fourteen AI support agents are a future design target, not a claim that those positions are currently staffed. No VETRA certification seal should be represented as externally accredited.

### VETRA intake activation gate

The form exports a local JSON draft when submissions are closed. Server submission is enabled only with the `TAMV_VETRA_SUBMISSIONS_ENABLED=true` environment variable, confirmed data-controller/privacy-contact values, `TAMV_VETRA_RETENTION_POLICY_APPROVED=true`, configured server-only Supabase keys and migration 003 applied and tested. Setting the environment flag does not itself confirm a migration has been run.

## HCU Ω∞ transformation map

HCU is a conceptual map and literature-discovery surface, not a validated forecast or causal model. Its 25 seed nodes, seven multi-entity relations, axis values, scenario weights and local pods are illustrative. The selected-node evidence search uses the repository's federated research metadata endpoint; provider records identify candidate sources and do not constitute peer-review or truth verification. See `docs/hcu-methodology.md`.

## Identity providers and ORCID

Auth0 signup/email login requires configured tenant connections and production callback values. GitHub login is exposed only when `AUTH0_GITHUB_CONNECTION` names an enabled Auth0 connection. Direct ORCID verification can start before TAMV ID creation or from an existing account. It requires `ORCID_CLIENT_ID`, `ORCID_CLIENT_SECRET`, the exact callback `APP_BASE_URL/api/orcid/callback`, and migration 004. A pre-registration ORCID is stored temporarily in an encrypted, short-lived cookie and linked only after a verified-email Auth0 session and successful TAMV registration. These environment variables default empty; the flow is not live until configured and browser-tested. Manual ORCID fields are stored as declared, not verified.

## ROR preparation

ROR eligibility is a separate decision by ROR. TAMV ID is an internal member identifier and does not create or confer a ROR ID. Before any request, document the actual collective entity, stable public identity, research activity, multiple contributors where applicable and publicly identifiable outputs that acknowledge the entity accurately. Do not invent affiliations, collaborators or output metadata to satisfy criteria. Consult ROR official documentation at https://ror.readme.io/docs/rest-api and current eligibility/request guidance before submitting.

## License

No general software/content license is declared by this README. Do not assume public-domain status or unrestricted reuse. Add a license only after the rights holder has chosen and verified its scope.
