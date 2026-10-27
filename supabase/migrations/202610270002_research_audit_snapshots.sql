-- TAMV Online Network — provenance-aware research audit snapshots
-- Apply through the Supabase CLI migration workflow or SQL Editor after review.
-- Snapshots are written only from a server-side API using a service-role/secret key.
begin;

create table if not exists public.tamv_research_audits (
  id uuid primary key default gen_random_uuid(),
  created_by_tamv_id text references public.tamv_members(tamv_id) on update restrict on delete set null,
  audit_type text not null check (audit_type in ('doi_metadata', 'research_record', 'ip_landscape')),
  subject text not null check (length(btrim(subject)) between 1 and 255),
  audit_hash text not null check (audit_hash ~ '^[0-9a-f]{64}$'),
  engine_version text not null,
  source_status jsonb not null default '[]'::jsonb,
  evidence_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  check (octet_length(evidence_snapshot::text) <= 150000)
);

create index if not exists tamv_research_audits_member_created_idx
  on public.tamv_research_audits (created_by_tamv_id, created_at desc);
create index if not exists tamv_research_audits_subject_idx
  on public.tamv_research_audits (subject, created_at desc);
create index if not exists tamv_research_audits_hash_idx
  on public.tamv_research_audits (audit_hash);

alter table public.tamv_research_audits enable row level security;
revoke all on table public.tamv_research_audits from public, anon, authenticated;
grant select, insert on table public.tamv_research_audits to service_role;

comment on table public.tamv_research_audits is
  'Server-generated research metadata snapshots with SHA-256 digest. Not a peer-review record, legal opinion, or financial valuation.';
comment on column public.tamv_research_audits.audit_hash is
  'SHA-256 of the canonical JSON snapshot produced by the application. Integrity indicator, not third-party timestamping or a qualified electronic signature.';
comment on column public.tamv_research_audits.created_by_tamv_id is
  'Optional member reference; set null when the member profile is deleted.';

commit;
