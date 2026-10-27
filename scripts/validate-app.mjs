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
  "app/api/auth/login/route.ts",
  "app/api/auth/callback/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/members/register/route.ts",
  "app/api/members/me/route.ts",
  "app/api/members/[tamvId]/route.ts",
  "app/miembro/[tamvId]/page.tsx",
  "app/catalogo/page.tsx",
  "app/recursos/page.tsx",
  "app/membresia/page.tsx",
  "app/privacidad/page.tsx",
  "app/terminos/page.tsx",
  "app/auditoria/page.tsx",
  "app/investigacion/page.tsx",
  "app/vetra/page.tsx",
  "app/vetra/propuesta-form.tsx",
  "app/roadmap/page.tsx",
  "app/api/vetra/proposals/route.ts",
  "app/api/research/search/route.ts",
  "app/api/research/audit/route.ts",
  "app/api/research/patents/route.ts",
  "lib/research-engine.ts",
  "supabase/migrations/202610270002_research_audit_snapshots.sql",
  "supabase/migrations/202610270003_vetra_proposals_reviews.sql",
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
const register = await source("app/api/members/register/route.ts");
const supabase = await source("lib/supabase-rest.ts");
const migration = await source("supabase/migrations/202610270001_tamv_identity_registry.sql");
const researchMigration = await source("supabase/migrations/202610270002_research_audit_snapshots.sql");
const researchEngine = await source("lib/research-engine.ts");
const researchSearch = await source("app/api/research/search/route.ts");
const researchAudit = await source("app/api/research/audit/route.ts");
const researchPatents = await source("app/api/research/patents/route.ts");
const vetraRoute = await source("app/api/vetra/proposals/route.ts");
const vetraPage = await source("app/vetra/page.tsx");
const vetraMigration = await source("supabase/migrations/202610270003_vetra_proposals_reviews.sql");
const vetraForm = await source("app/vetra/propuesta-form.tsx");
const privacy = await source("app/privacidad/page.tsx");
const workflow = await source(".github/workflows/site-quality.yml");
const pkgText = await source("package.json");
const vercelText = await source("vercel.json");
const envExample = await source(".env.example");

let pkg = {};
let vercel = {};
try { pkg = JSON.parse(pkgText); } catch { failures.push("package.json is invalid JSON"); }
try { vercel = JSON.parse(vercelText); } catch { failures.push("vercel.json is invalid JSON"); }

for (const key of ["build", "typecheck", "validate:site", "validate:app"]) {
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
for (const term of ["TAMV_VETRA_SUBMISSIONS_ENABLED", "TAMV_VETRA_RETENTION_POLICY_APPROVED", "sameOriginRequest", "createVetraProposal", "filter1IntegrityAndProvenance", "filter2MethodAndReproducibility", "filter3ResponsibleUseAndRights", "submitterAttested"]) { if (!vetraRoute.includes(term)) failures.push("VETRA API missing security/gate control: " + term); }
for (const term of ["tamv_vetra_proposals", "tamv_vetra_reviews", "tamv_vetra_decisions", "enable row level security", "revoke all on table", "conflict_checks_complete", "appeal_window_days"]) { if (!vetraMigration.toLowerCase().includes(term.toLowerCase())) failures.push("VETRA migration missing schema/security marker: " + term); }
for (const term of ["filter1IntegrityAndProvenance", "filter2MethodAndReproducibility", "filter3ResponsibleUseAndRights", "Descargar borrador JSON", "no se ha enviado al servidor"]) { if (!vetraForm.includes(term)) failures.push("VETRA client intake missing user-facing gate or draft behavior: " + term); }
if (!vetraPage.includes("VETRA Ω∞") || !vetraPage.includes("submissionConfiguration")) failures.push("VETRA public page missing canonical title or submission status.");
if (!envExample.includes("TAMV_VETRA_SUBMISSIONS_ENABLED=false") || !envExample.includes("TAMV_VETRA_RETENTION_POLICY_APPROVED=false")) failures.push("VETRA launch flags must default to false.");
if (!/NEXT_PUBLIC_SUPABASE_(SERVICE_ROLE|SECRET)/i.test(supabase + register + envExample)) failures.push("A Supabase administrative key must never use a NEXT_PUBLIC_ variable.");
if (!privacy.includes("TAMV_DATA_CONTROLLER_ADDRESS") || !register.includes("TAMV_PRIVACY_CONTACT_EMAIL")) failures.push("Privacy launch gate is missing controller/address/contact checks.");
if (!workflow.includes("pnpm validate:app") || !workflow.includes("pnpm typecheck") || !workflow.includes("pnpm build")) failures.push("GitHub Actions is missing one or more application quality gates.");
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
