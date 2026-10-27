# TAMV Research Audit & IP Intelligence — connector map

Version: 1.0.0  
Last updated: 27 October 2026  
Scope: Next.js App Router, public research metadata APIs, DOI record comparison, preliminary patent search, Isabella evidence/transfer triage, and optional Supabase audit snapshots.

## Purpose and limits

This service is a **research-discovery and provenance assistant**, not a journal index, peer-review service, legal opinion, IP office, patent examiner, or financial valuation service. It makes requests only to public metadata endpoints and optional authorized APIs. It does not scrape access-restricted websites, circumvent subscription entitlements, or infer that a missing record does not exist.

The six initial capabilities are:

1. Federated metadata discovery across OpenAlex, Crossref, DataCite, OpenAIRE Graph and PubMed/NCBI, with a separate ROR organization lookup.
2. DOI cross-check across Crossref, DataCite and OpenAlex.
3. Evidence-readiness and transfer-triage score with explicit weights and next actions.
4. Prior-art discovery through EPO Open Patent Services when authorized credentials are configured, plus official manual search links.
5. SHA-256 snapshot digest, optional download as JSON, and optional persistence in Supabase.
6. A provider/API map that distinguishes public endpoints, credential-gated connectors, licensed products and manual-only destinations.

## Routes

- `/auditoria`: institutional research, DOI, IP and API workspace.
- `POST /api/research/search`: federated public metadata search across OpenAlex, Crossref, DataCite, OpenAIRE and PubMed, or ROR in organization mode.
- `POST /api/research/audit`: DOI metadata comparison, evidence triage and digest; optional save to Supabase only when explicitly requested.
- `POST /api/research/patents`: EPO OPS query when credentials exist; returns official fallback links for sources that are not automated.
- `/investigacion`: public index of project/founder records and links.

All routes run on the server. Query bodies have explicit size limits and remote requests use timeouts. Public metadata searches are bounded to small result sets. Production deployments should add a Vercel Firewall/rate-limit policy and monitoring before offering high-volume access.

## API and provider matrix

| Provider | Documented interface | Access and use in TAMV |
|---|---|---|
| OpenAlex | [API reference](https://help.openalex.org/api/) — `GET /works?search=...` | Public metadata search is active. Results may include scholarly works, authors, sources, institutions and citations. Citation counts are not a universal quality metric. |
| Crossref | [REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) — `GET /works?query.bibliographic=...`, `GET /works/{doi}` | Active. Metadata is deposited by registrants; it does not imply peer review or validate underlying claims. A `mailto`/User-Agent is supplied when the contact environment variable is configured. |
| DataCite | [REST API](https://support.datacite.org/docs/rest-api) — `GET /dois?query=...`, `GET /dois/{doi}` | Active. Public API does not require authentication and returns DOI records in Findable state; drafts and Registered-only records are not returned by the public endpoint. TAMV does not mint DOI in this code. |
| OpenAIRE Graph | [Graph API v4](https://graph.openaire.eu/docs/apis/graph-api-v4/quickstart/) — `GET /graph/v4/research-products?search=...&page_size=...` | Active. Queries OpenAIRE's public research-product graph; this implementation asks for a maximum of 8 products per query. Public API rate limits and coverage apply; not an endorsement or peer-review guarantee. |
| PubMed / NCBI | [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/home/develop/api/) — `esearch.fcgi` + `esummary.fcgi` with `db=pubmed` | Active for metadata only. Public lookup works without an API key; optional `NCBI_API_KEY` can raise request allowance. The connector does not fetch article full text or make clinical claims. PMC reuse rights remain article-specific. |
| ROR | [REST API](https://ror.readme.io/docs/rest-api) — `GET /v2/organizations?query=...` | Active for organization-name queries. Finding a ROR record does not determine whether TAMV is eligible for an ID. |
| ORCID | [Public API](https://info.orcid.org/what-is-orcid/services/public-api/) | Link/reference only in this release. API credentials, terms compliance, consent and identity-ownership verification must be completed before automatic queries are activated. A syntactically valid ORCID is not proof of control by the member. |
| OSF | [API v2 docs](https://developer.osf.io/) | Link/reference only in this release. OSF supports OAuth and token-based access; private project actions must be explicitly authorized. No OSF record is treated as an endorsement. |
| EPO Open Patent Services | [EPO Developer Portal](https://developers.epo.org/) | Active only if `EPO_OPS_KEY` and `EPO_OPS_SECRET` are set server-side. OAuth client credentials; responses use patent XML. The current adapter extracts a small number of publication/title fields and is a discovery aid, not exhaustive family or legal-status analysis. Register an app and review EPO terms and quotas. |
| USPTO Open Data Portal | [Getting started](https://data.uspto.gov/apis/getting-started) | Official link is exposed. A key is required. The current adapter does **not** execute a general patent search against USPTO, because the exact supported endpoint and query schema must be enabled and tested before being represented as active. |
| WIPO PATENTSCOPE | [Terms of use](https://www.wipo.int/en/web/patentscope/data/terms_patentscope) | Manual link only. WIPO's published terms prohibit automated search queries and scraping. TAMV does not crawl PATENTSCOPE. |
| Google Scholar | [Scholar search](https://scholar.google.com/) | Manual discovery link only. No automated scraping is used and Scholar results are not treated as curated peer-review validation. |
| Scopus / Web of Science | [Elsevier APIs](https://dev.elsevier.com/), [Clarivate API portal](https://developer.clarivate.com/) | Not connected. Application registration, product entitlement, license/subscription and access conditions may apply. API keys alone do not imply entitlement. |
| Dimensions | [Analytics API](https://docs.dimensions.ai/dsl/api.html) | Not connected. API access generally requires an institutional subscription or explicit entitlement and key. Its documentation advises against using Analytics API to power derivative dashboards; TAMV must confirm licensing and intended use before any connector. |
| arXiv, IEEE Xplore, ACM DL, SpringerLink, ScienceDirect, Nature Portfolio, Science | Official portals | Link-only in this release. Terms, APIs, licensing and coverage differ. No subscription access is bypassed. |
| Zenodo / Figshare / CERN | [Zenodo](https://zenodo.org/), [Figshare](https://figshare.com/) | Curated repository links; write/deposit operations require explicit user/provider credentials and permissions. A DOI is not a peer-review seal; CERN infrastructure is not an endorsement of work deposited on Zenodo. |
| NIST / Eclipse Foundation / WEF | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), [Eclipse Foundation](https://www.eclipse.org/), [WEF](https://www.weforum.org/) | Governance, standards, open-source foundation and strategy references. TAMV links them as methodological sources; no affiliation, certification or endorsement is claimed. |
| Sourcegraph / LearnWorlds | [Sourcegraph API](https://sourcegraph.com/docs/api), [LearnWorlds API](https://support.learnworlds.com/support/solutions/articles/12000017230-learnworlds-api-documentation) | Not connected. Sourcegraph interfaces vary by deployment/version; LearnWorlds requires authorized tenant API access. They are prospective developer/learning integrations, not research evidence authorities. |
| ISNI | [ISNI](https://isni.org/) | Link-only. External identifier must be matched to its source record; TAMV cannot claim to verify ownership merely from an input format or external link. |

## How a DOI audit works

1. The API accepts a DOI or DOI URL, normalizes it and checks the format.
2. Crossref, DataCite and OpenAlex are queried independently in parallel.
3. The service returns the status for each provider: found, not found or unavailable. A provider timeout is not treated as evidence of absence.
4. Returned metadata are compared (title, authors, year, publisher/venue, type, license).
5. A canonicalized response snapshot receives a SHA-256 digest. This digest is an integrity check if someone later compares the same bytes; it is **not** a third-party timestamp, digital signature, notarization or proof of publication date.
6. The JSON can be downloaded. Saving to Supabase is opt-in and requires Auth0 session, an existing TAMV member profile, the migration below and `TAMV_RESEARCH_AUDIT_PERSISTENCE_ENABLED=true`.

The service intentionally does not classify records as peer-reviewed based only on the presence of a DOI, publisher, venue or citation count.

## Isabella evidence and economic-transfer triage

The current deterministic model calculates an **evidence/transfer readiness** score, not a monetary value:

| Component | Weight | What it measures |
|---|---:|---|
| Metadata completeness | 30% | Title, authors, year, DOI, publisher and resolvable URL present |
| Reproducibility | 25% | Method, versions, environment and reproduction steps documented |
| Rights and license | 20% | A confirmed license or rights statement is present |
| External review | 15% | Explicit evidence of an external assessment is recorded |
| IP landscape | 10% | A documented prior-art/IP review has been completed |

A missing input scores zero **as undocumented**, not as proof the work has never been tested or has no rights. The first DOI audit has no reproducibility, external-review or IP assertions, so its score will intentionally remain low even if metadata is complete. This is a transparency tool to identify next actions, not a scientific score.

The economic/transfer workflow should use these outputs to create tasks: verify metadata, record license, reproduce tests, obtain independent review, document ownership/contributor agreements, and commission an IP review where appropriate. It does not estimate market price, patent valuation, revenue, probability of grant, freedom to operate or legal infringement. Those require separate evidence and specialist analysis.

## Patent and IP scope

- EPO OPS uses OAuth credentials; the API response is XML. The adapter searches titles only in this version. A real novelty/prior-art review must also search synonyms, translations, IPC/CPC classifications, patent families, citations, claims and legal events.
- USPTO ODP has a separate API key and per-endpoint request/response schema. Do not copy its key into client code, a `NEXT_PUBLIC_*` variable, logs or a public issue.
- WIPO PATENTSCOPE is opened manually because its published terms prohibit automated searches and scraping.
- The results do not determine patent validity, novelty, infringement, ownership or freedom to operate. Check national/regional registers and engage qualified counsel before filing, licensing, making investment decisions or shipping a product.

## Supabase schema and security

Migration: `supabase/migrations/202610270002_research_audit_snapshots.sql`.

The table `tamv_research_audits` holds a member reference (set null if the member profile is deleted), audit type, public DOI subject, SHA-256 digest, engine version, source statuses, snapshot JSON and timestamp. RLS is enabled; public/anon/authenticated table privileges are revoked; only the server role is granted table access. The service-role key must never be sent to the browser.

Apply migration 001 (member identity) before migration 002 (audit snapshots), then test RLS and grants. Keep `TAMV_RESEARCH_AUDIT_PERSISTENCE_ENABLED=false` until the database migration, backup/retention policy and access restrictions have been confirmed. No Supabase change is performed automatically by a GitHub code commit.

## Production environment

Optional server-only variables:

- `TAMV_CONTACT_EMAIL`: contact string for polite-pool/API identification where supported.
- `EPO_OPS_KEY` / `EPO_OPS_SECRET`: registered EPO OPS app credentials.
- `TAMV_RESEARCH_AUDIT_PERSISTENCE_ENABLED=false`: remain false until the migration and access tests pass.
- `USPTO_ODP_API_KEY`: reserved configuration value; no general USPTO patent search is executed by this release yet.

After setting any variable, redeploy and verify that the key is not exposed in client bundles, browser requests, error messages or logs. Rotate it immediately if exposed.

## Quality and launch checklist

- [ ] `pnpm typecheck` passes.
- [ ] `pnpm validate:app` passes.
- [ ] `pnpm build` passes.
- [ ] OpenAlex, Crossref, DataCite and ROR produce source-by-source statuses on success, empty response and remote outage.
- [ ] DOI audit handles invalid DOI, provider 404, timeout, mismatched metadata, and partial coverage.
- [ ] SHA-256 is stable for the same exact canonical snapshot.
- [ ] Supabase migration 002 applied and tested in the correct project; RLS/grants verified by SQL test.
- [ ] Save audit is unavailable to unauthenticated users and to users without TAMV member records.
- [ ] EPO integration works only with authorized server credentials; no keys appear client-side.
- [ ] WIPO PATENTSCOPE is opened manually and not scraped.
- [ ] Vercel rate limits/monitoring and privacy notice cover research audit snapshots before public-scale use.
- [ ] Test mobile UI and accessible keyboard/screen-reader workflows in a real browser.
- [ ] Confirm the deployed production domain and environment variables separately.

## Primary documentation

- [OpenAlex API](https://help.openalex.org/api/)
- [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [DataCite REST API](https://support.datacite.org/docs/rest-api)
- [ROR REST API](https://ror.readme.io/docs/rest-api)
- [ORCID Public API](https://info.orcid.org/what-is-orcid/services/public-api/)
- [OSF API v2](https://developer.osf.io/)
- [EPO Open Patent Services](https://developers.epo.org/)
- [USPTO ODP API](https://data.uspto.gov/apis/getting-started)
- [WIPO PATENTSCOPE terms](https://www.wipo.int/en/web/patentscope/data/terms_patentscope)
- [Elsevier developer portal](https://dev.elsevier.com/)
- [Clarivate developer portal](https://developer.clarivate.com/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
