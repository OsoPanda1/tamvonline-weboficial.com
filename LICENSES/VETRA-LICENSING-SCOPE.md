# VETRA Ω∞ — scope of documentation and software licenses

This file records the license scope specified for the original VETRA Ω∞ materials and code. It does not change the license of unrelated pre-existing repository content or third-party assets.

## Documentation — Creative Commons Attribution 4.0 International (CC BY 4.0)

The original textual content of the following VETRA documents is designated under CC BY 4.0:

- `docs/vetra-executive-brief.md`
- `docs/CANON-VETRA-OMEGA-INFINITY-2026-V1.0.md`
- `docs/vetra-metrics-and-use-cases.md`
- `docs/vetra-foundations-en.md`
- `docs/roadmap-institutional-2026-2028.md`

Canonical legal code: https://creativecommons.org/licenses/by/4.0/legalcode

Attribution should preserve the VETRA name, canonical code/version, author attribution as stated in the document, and a link to the source. CC BY 4.0 does not grant rights to any third-party content, logos, patents, trademarks, personal data, or materials expressly excluded from the license.

## Software — Apache License 2.0

The original VETRA-specific implementation files listed below are designated under Apache License 2.0:

- `app/vetra/page.tsx`
- `app/vetra/propuesta-form.tsx`
- `app/vetra/mis-propuestas/page.tsx`
- `app/vetra/revision/page.tsx`
- `app/vetra/revision/reviewer-console.tsx`
- `app/vetra/decision/page.tsx`
- `app/vetra/decision/decision-console.tsx`
- `app/api/vetra/proposals/route.ts`
- `app/api/vetra/reviews/route.ts`
- `app/api/vetra/decisions/route.ts`
- `supabase/migrations/202610270003_vetra_proposals_reviews.sql`
- `supabase/tests/vetra_review_security_checks.sql`

Canonical license: https://www.apache.org/licenses/LICENSE-2.0

Apache 2.0 is applied only to original code in the listed paths. Dependencies, icons, imported libraries, other contributors' work, and pre-existing repository files retain the licenses that apply to them. Review all contributor ownership and third-party notices before distributing a release.

## Shared files and mixed content

Files such as `app/page.tsx`, `app/globals.css`, `README.md`, and `lib/supabase-rest.ts` also contain code or content that predates this VETRA increment. This scope note does not silently re-license those complete files. Before assigning a repository-wide license, the rights holder should confirm ownership and compatibility for all existing material.

## Status and governance boundary

The license selection does not certify VETRA, establish a legal entity, constitute a committee, grant accreditation, or validate the project's scientific claims. It only states the intended reuse terms for original content/code identified above.
