import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "app/registro/page.tsx",
  "app/registro/registration-form.tsx",
  "app/cuenta/page.tsx",
  "app/components/site-header.tsx",
  "app/comunidad/page.tsx",
  "scripts/smoke-routes.mjs",
  "app/api/auth/login/route.ts",
  "app/api/auth/callback/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/orcid/connect/route.ts",
  "app/api/orcid/callback/route.ts",
  "app/api/orcid/pending/route.ts",
  "app/api/members/register/route.ts",
  "app/api/members/me/route.ts",
  "app/api/members/[tamvId]/route.ts",
  "app/miembro/[tamvId]/page.tsx",
  "app/miembros/page.tsx",
  "app/miembros/member-directory.tsx",
  "app/catalogo/page.tsx",
  "app/recursos/page.tsx",
  "app/membresia/page.tsx",
  "app/privacidad/page.tsx",
  "app/terminos/page.tsx",
  "app/auditoria/page.tsx",
  "app/hcu/page.tsx",
  "app/hcu/hcu-universe.tsx",
  "lib/hcu-model.ts",
  "app/investigacion/page.tsx",
  "app/vetra/page.tsx",
  "app/vetra/propuesta-form.tsx",
  "app/vetra/mis-propuestas/page.tsx",
  "app/roadmap/page.tsx",
  "app/api/vetra/proposals/route.ts",
  "app/api/vetra/reviews/route.ts",
  "app/api/vetra/decisions/route.ts",
  "app/vetra/revision/page.tsx",
  "app/vetra/revision/reviewer-console.tsx",
  "app/vetra/decision/page.tsx",
  "app/vetra/decision/decision-console.tsx",
  "app/api/research/search/route.ts",
  "app/api/research/audit/route.ts",
  "app/api/research/patents/route.ts",
  "lib/research-engine.ts",
  "supabase/migrations/202610270002_research_audit_snapshots.sql",
  "supabase/migrations/202610270003_vetra_proposals_reviews.sql",
  "supabase/migrations/202610270004_orcid_verified_link.sql",
  "supabase/tests/vetra_review_security_checks.sql",
  "docs/research-audit-api-map.md",
  "docs/vetra-executive-brief.md",
  "docs/CANON-VETRA-OMEGA-INFINITY-2026-V1.0.md",
  "docs/vetra-metrics-and-use-cases.md",
  "docs/vetra-foundations-en.md",
  "docs/roadmap-institutional-2026-2028.md",
  "app/sitemap.ts",
  "app/robots.ts",
  "lib/auth0-native.ts",
  "lib/supabase-rest.ts",
  "supabase/migrations/202610270001_tamv_identity_registry.sql",
  "docs/tamv-id-runbook.md",
  "docs/identity-providers-runbook.md",
  "docs/hcu-methodology.md",
  ".env.example",
  ".github/workflows/site-quality.yml",
];
const failures = [];
const warnings = [];
async function source(path) {
  try { return await readFile(join(root, path), "utf8"); }
  catch { failures.push("Missing required file: " + path); return ""; }
}
for (const path of required) await source(path);

const auth = await source("lib/auth0-native.ts");
const authLogin = await source("app/api/auth/login/route.ts");
const registrationForm = await source("app/registro/registration-form.tsx");
const hcuPage = await source("app/hcu/page.tsx");
const hcuComponent = await source("app/hcu/hcu-universe.tsx");
const hcuModel = await source("lib/hcu-model.ts");
const sourceHeader = await source("app/components/site-header.tsx");
const memberDirectory = await source("app/miembros/page.tsx");
const memberDirectoryClient = await source("app/miembros/member-directory.tsx");
const orcidConnect = await source("app/api/orcid/connect/route.ts");
const orcidCallback = await source("app/api/orcid/callback/route.ts");
const orcidPending = await source("app/api/orcid/pending/route.ts");
const siteHeader = await source("app/components/site-header.tsx");
const communityAlias = await source("app/comunidad/page.tsx");
const orcidMigration = await source("supabase/migrations/202610270004_orcid_verified_link.sql");
const register = await source("app/api/members/register/route.ts");
const supabase = await source("lib/supabase-rest.ts");
const migration = await source("supabase/migrations/202610270001_tamv_identity_registry.sql");
const researchMigration = await source("supabase/migrations/202610270002_research_audit_snapshots.sql");
const researchEngine = await source("lib/research-engine.ts");
const researchSearch = await source("app/api/research/search/route.ts");
const researchAudit = await source("app/api/research/audit/route.ts");
const researchPatents = await source("app/api/research/patents/route.ts");
const vetraRoute = await source("app/api/vetra/proposals/route.ts");
const vetraReviewRoute = await source("app/api/vetra/reviews/route.ts");
const vetraDecisionRoute = await source("app/api/vetra/decisions/route.ts");
const vetraReviewerPage = await source("app/vetra/revision/page.tsx");
const vetraDecisionPage = await source("app/vetra/decision/page.tsx");
const vetraPage = await source("app/vetra/page.tsx");
const vetraMigration = await source("supabase/migrations/202610270003_vetra_proposals_reviews.sql");
const vetraForm = await source("app/vetra/propuesta-form.tsx");
const privacy = await source("app/privacidad/page.tsx");
const workflow = await source(".github/workflows/site-quality.yml");
const smokeRoutes = await source("scripts/smoke-routes.mjs");
const pkgText = await source("package.json");
const vercelText = await source("vercel.json");
const envExample = await source(".env.example");

let pkg = {};
let vercel = {};
try { pkg = JSON.parse(pkgText); } catch { failures.push("package.json is invalid JSON"); }
try { vercel = JSON.parse(vercelText); } catch { failures.push("vercel.json is invalid JSON"); }

for (const key of ["build", "typecheck", "validate:site", "validate:app", "smoke:routes"]) {
  if (!pkg.scripts?.[key]) failures.push("package.json missing script: " + key);
}
for (const term of ["createCipheriv", "createDecipheriv", "code_challenge_method", "secureEquals", "verifyAuth0IdToken", "nonce", "RS256"]) {
  if (!auth.includes(term)) failures.push("Auth0 implementation missing security control: " + term);
}
for (const term of ["sameOriginRequest", "emailVerified", "adultConfirmed", "termsAccepted", "privacyAccepted", "TAMV_REGISTRATION_ENABLED", "publicProfileConsent"]) {
  if (!register.includes(term)) failures.push("Registration API missing control: " + term);
}
for (const term of ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "rpc/tamv_register_member", "rpc/tamv_delete_member"]) {
  if (!supabase.includes(term)) failures.push("Supabase server layer missing: " + term);
}
for (const term of ["enable row level security", "revoke all on table", "tamv_register_member", "tamv_delete_member", "adult_confirmed", "pending_review", "withdrawn"]) {
  if (!migration.toLowerCase().includes(term.toLowerCase())) failures.push("SQL migration missing security/schema marker: " + term);
}
for (const term of ["tamv-evidence-transfer-1.0.0", "metadataCompleteness", "reproducibility", "rightsAndLicense", "externalReview", "intellectualProperty"]) { if (!researchEngine.includes(term)) failures.push("Evidence engine missing marker: " + term); }
for (const term of ["api.openalex.org/works", "api.crossref.org/works", "api.datacite.org/dois", "api.ror.org/v2/organizations", "api.openaire.eu/graph/v4/research-products", "eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"]) { if (!researchSearch.includes(term)) failures.push("Research search connector missing: " + term); }
for (const term of ["auditHash", "Crossref", "DataCite", "OpenAlex", "saveResearchAuditSnapshot"]) { if (!researchAudit.includes(term)) failures.push("DOI audit route missing: " + term); }
for (const term of ["EPO_OPS_KEY", "EPO_OPS_SECRET", "link_only", "PATENTSCOPE"]) { if (!researchPatents.includes(term)) failures.push("IP audit route missing: " + term); }
for (const term of ["enable row level security", "revoke all on table", "tamv_research_audits", "audit_hash", "evidence_snapshot"]) { if (!researchMigration.toLowerCase().includes(term.toLowerCase())) failures.push("Research audit migration missing marker: " + term); }
for (const term of ["TAMV_VETRA_SUBMISSIONS_ENABLED", "TAMV_VETRA_RETENTION_POLICY_APPROVED", "TAMV_VETRA_SCHEMA_VERIFIED", "sameOriginRequest", "createVetraProposal", "getRecentVetraProposalCount", "getVetraProposalsForMember", "filter1IntegrityAndProvenance", "filter2MethodAndReproducibility", "filter3ResponsibleUseAndRights", "submitterAttested", "getVetraProposalsForMember"]) { if (!vetraRoute.includes(term)) failures.push("VETRA API missing security/gate control: " + term); }
for (const term of ["tamv_vetra_proposals", "tamv_vetra_reviews", "tamv_vetra_decisions", "tamv_vetra_anonymize_on_member_delete", "tamv_vetra_submit_proposal", "tamv_vetra_finalize_decision", "pg_advisory_xact_lock", "enable row level security", "revoke all on table", "conflict_checks_complete", "appeal_window_days"]) { if (!vetraMigration.toLowerCase().includes(term.toLowerCase())) failures.push("VETRA migration missing schema/security marker: " + term); }
for (const term of ["filter1IntegrityAndProvenance", "filter2MethodAndReproducibility", "filter3ResponsibleUseAndRights", "Descargar borrador JSON", "no se ha enviado al servidor"]) { if (!vetraForm.includes(term)) failures.push("VETRA client intake missing user-facing gate or draft behavior: " + term); }
if (!vetraPage.includes("VETRA Ω∞") || !vetraPage.includes("submissionConfiguration")) failures.push("VETRA public page missing canonical title or submission status.");
for (const term of ["TAMV_VETRA_REVIEW_CONSOLE_ENABLED", "TAMV_VETRA_REVIEWER_EMAILS", "hasConflict", "financialInterest", "involvedInDevelopment", "recentCollaboration", "saveVetraReview", "sameOriginRequest"]) { if (!vetraReviewRoute.includes(term)) failures.push("VETRA reviewer endpoint missing access/conflict control: " + term); }
for (const term of ["TAMV_VETRA_DECISION_CONSOLE_ENABLED", "TAMV_VETRA_DECISION_EMAILS", "getVetraLatestReviewsForDecision", "criticalFailures", "accepted_with_conditions", "sameOriginRequest"]) { if (!vetraDecisionRoute.includes(term)) failures.push("VETRA decision endpoint missing control: " + term); }
if (!vetraReviewerPage.includes("TAMV_VETRA_REVIEWER_EMAILS") || !vetraDecisionPage.includes("TAMV_VETRA_DECISION_EMAILS")) failures.push("VETRA privileged pages must enforce separate email allowlists.");
for (const term of ["hcuDomains", "hcuAtoms", "hcuHyperedges", "futurePotential", "evidence-needed", "HCU-DEMO-1.0", "id:'ai'", "id:'economy'", "id:'governance'", "id:'climate'", "id:'health'", "id:'security'"]) { if (!hcuModel.includes(term)) failures.push("HCU model missing domain/entity/evidence marker: " + term); }
for (const term of ["TAMV Ω∞ HCU", "TRANSFORMATION", "MODEL", "/api/research/search", "scenarioWeights", "hcu-live-evidence", "provider", "No es un pronóstico validado"]) { if (!hcuComponent.toLowerCase().includes(term.toLowerCase())) failures.push("HCU UI missing interactive/evidence boundary marker: " + term); }
for (const term of ["verifySnapshotFile", "SHA-512", "digestHex", "cryptographicSignature:false", "bookpiAnchor:false", "hcu-snapshot-verifier", "No se verifica una firma"]) { if (!hcuComponent.includes(term)) failures.push("HCU snapshot export/verifier missing integrity boundary: " + term); }
if (!hcuComponent.includes("hcu-entity-browser") || !hcuComponent.includes("aria-label=\"Universo HCU")) failures.push("HCU accessible entity browser and canvas description must exist.");
if (!hcuPage.includes("HcuUniverse") || !hcuPage.includes("/vetra")) failures.push("HCU public route missing interactive component or VETRA relationship.");
for (const term of ["getPublicMembers", "MemberDirectory", "profiles.length"]) { if (!memberDirectory.includes(term)) failures.push("Public member directory missing data/empty-state marker: " + term); }
for (const term of ["profile.research_areas", "profile.identifiers", "safeExternalUrl", "No hay resultados", "clearFilters"]) { if (!memberDirectoryClient.includes(term)) failures.push("Member directory missing discovery/privacy marker: " + term); }
for (const term of ["membership_status=eq.approved", "profile_visibility=eq.public", "public_profile_consent=eq.true", "verification_status=eq.verified"]) { if (!supabase.includes(term)) failures.push("Public member lookup missing approval/consent/verified-identifier gate: " + term); }
if (!required.includes("app/miembros/page.tsx") || !required.includes("app/miembros/member-directory.tsx") || !required.includes("app/components/site-header.tsx")) failures.push("Member directory and shared navigation must be included in static checks.");
if (!sourceHeader.includes("href:'/miembros'")) failures.push("Shared navigation must expose the public member directory.");
for (const term of ["AUTH0_GITHUB_CONNECTION", "AUTH0_ORCID_CONNECTION", "code_challenge_method", "safeReturnTo", "nonce"]) { if (!authLogin.includes(term)) failures.push("Auth0 provider login missing connection/security marker: " + term); }
for (const term of ["githubConnectionAvailable", "orcidConnectionAvailable", "orcidOAuthConfigured", "registrationEnabled", "pendingOrcid", "provider-unavailable", "Crear cuenta con correo"]) { if (!registrationForm.includes(term)) failures.push("Registration UI missing provider configuration/availability marker: " + term); }
for (const term of ["https://orcid.org/oauth/authorize", "/authenticate", "state", "auth0Sub", "mode", "sealPayload", "cookieOptions"]) { if (!orcidConnect.includes(term)) failures.push("ORCID connect route missing OAuth security/scope marker: " + term); }
for (const term of ["https://orcid.org/oauth/token", "canonicalOrcid", "linkVerifiedOrcidIdentity", "session.sub", "secureEquals"]) { if (!orcidCallback.includes(term)) failures.push("ORCID callback missing identity/state verification: " + term); }
for (const term of ['"signup"', 'pendingOrcidCookieName', 'sealPayload', 'cookieOptions', 'safeReturnTo']) { if (!orcidConnect.includes(term)) failures.push("ORCID signup/link route missing pending-flow security marker: " + term); }
for (const term of ['mode === "signup"', 'pendingOrcidCookieName', 'cookieOptions(30 * 60)', 'secureEquals(state, transaction.state)', 'canonicalOrcid']) { if (!orcidCallback.includes(term)) failures.push("ORCID callback missing signup handoff or transaction validation: " + term); }
for (const term of ['pendingOrcidCookieName', 'cookieOptions(0)', 'no-store']) { if (!orcidPending.includes(term)) failures.push("ORCID pending cancellation route missing safe cookie cleanup: " + term); }
for (const term of ['AUTH0_GITHUB_CONNECTION', 'AUTH0_ORCID_CONNECTION', 'auth0Config', 'code_challenge_method', 'nonce']) { if (!authLogin.includes(term)) failures.push("Login route missing configured identity-provider/security marker: " + term); }
for (const term of ['getOrcidOwners', 'linkVerifiedOrcidIdentity', 'pendingOrcid', 'session.emailVerified']) { if (!register.includes(term)) failures.push("Member registration missing ORCID-first ownership/email validation: " + term); }
for (const term of ["currentServerSession", "/miembros", "/investigacion", "/hcu", "/vetra", "/roadmap", "site-nav-menu"]) { if (!siteHeader.includes(term)) failures.push("Shared navigation missing page-group or session control: " + term); }
for (const term of ['membership_status=eq.approved', 'profile_visibility=eq.public', 'public_profile_consent=eq.true', 'verification_status=eq.verified', 'getPublicMembers']) { if (!supabase.includes(term)) failures.push("Public community data access is missing consent/verification filters: " + term); }
if (!communityAlias.includes("redirect('/miembros')")) failures.push("Legacy /comunidad path must redirect to the canonical /miembros directory.");

for (const term of ["tamv_link_verified_orcid", "verification_status='verified'", "revoke all on function", "auth.role()"]) { if (!orcidMigration.includes(term)) failures.push("ORCID migration missing server-only/verification control: " + term); }
if (!envExample.includes("AUTH0_GITHUB_CONNECTION=") || !envExample.includes("AUTH0_ORCID_CONNECTION=") || !envExample.includes("ORCID_CLIENT_ID=") || !envExample.includes("ORCID_CLIENT_SECRET=")) failures.push("Provider environment variables must be documented.");
if (!required.includes("app/hcu/page.tsx") || !required.includes("docs/identity-providers-runbook.md")) failures.push("HCU/provider documentation must be required in static checks.");
if (!vercelText.includes("Content-Security-Policy")) warnings.push("Review the live CSP and browser console during production QA; static header configuration alone is not enough.");

if (!envExample.includes("TAMV_VETRA_SUBMISSIONS_ENABLED=false") || !envExample.includes("TAMV_VETRA_RETENTION_POLICY_APPROVED=false") || !envExample.includes("TAMV_VETRA_SCHEMA_VERIFIED=false") || !envExample.includes("TAMV_VETRA_GOVERNANCE_APPROVED=false") || !envExample.includes("TAMV_VETRA_REVIEW_CONSOLE_ENABLED=false") || !envExample.includes("TAMV_VETRA_DECISION_CONSOLE_ENABLED=false")) failures.push("VETRA launch flags must default to false.");
if (/NEXT_PUBLIC_SUPABASE_(SERVICE_ROLE|SECRET)/i.test(supabase + register + envExample)) failures.push("A Supabase administrative key must never use a NEXT_PUBLIC_ variable.");
if (!privacy.includes("TAMV_DATA_CONTROLLER_ADDRESS") || !register.includes("TAMV_PRIVACY_CONTACT_EMAIL")) failures.push("Privacy launch gate is missing controller/address/contact checks.");
if (!workflow.includes("pnpm validate:app") || !workflow.includes("pnpm typecheck") || !workflow.includes("pnpm build") || !workflow.includes("pnpm smoke:routes")) failures.push("GitHub Actions is missing one or more application quality gates.");
for (const term of ["/miembros", "/hcu", "/vetra", "/auditoria", "/comunidad", "text/html", "redirect to /miembros", "unauthenticated access is gated"]) { if (!smokeRoutes.includes(term)) failures.push("Post-build smoke tests missing route/security assertion: " + term); }
const headers = vercel.headers?.flatMap((entry) => entry.headers || []) || [];
for (const h of ["X-Content-Type-Options", "X-Frame-Options", "Content-Security-Policy", "Referrer-Policy"]) {
  if (!headers.some((header) => header.key === h)) warnings.push("Vercel header not found: " + h);
}
if (envExample.includes("eyJ") || /sk-[A-Za-z0-9]{20,}/.test(envExample)) failures.push(".env.example appears to contain credential-like data.");
if (!migration.includes("grant execute on function public.tamv_register_member(text,text,boolean,boolean")) failures.push("The service_role grant signature for tamv_register_member may not match the SQL function signature.");

if (failures.length) {
  console.error("TAMV APP VALIDATION: FAILED");
  for (const failure of failures) console.error("ERROR: " + failure);
  for (const warning of warnings) console.warn("WARN: " + warning);
  process.exit(1);
}
console.log("TAMV APP VALIDATION: PASSED");
console.log(`Checked ${required.length} required application/schema/config files and core auth, consent, RLS and privacy gates.`);
console.log("This is a static source check. It does not apply migrations, verify external credentials, execute TypeScript, or validate a live deployment.");
for (const warning of warnings) console.warn("WARN: " + warning);
