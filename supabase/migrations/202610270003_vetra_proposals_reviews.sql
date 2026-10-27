-- VETRA Ω∞ proposal intake and review ledger.
-- Apply only after reviewing the legal/privacy gates. Server-only REST uses service_role/secret key.
begin;

create table if not exists public.tamv_vetra_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_code text not null unique default (
    'VETRA-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  submitted_by_tamv_id text references public.tamv_members(tamv_id) on update restrict on delete set null,
  submitter_display_name text not null check (length(btrim(submitter_display_name)) between 2 and 120),
  title text not null check (length(btrim(title)) between 8 and 180),
  proposal_type text not null check (proposal_type in ('research', 'software', 'ai_system', 'dataset', 'infrastructure', 'education', 'territorial_knowledge', 'other')),
  maturity_stage text not null check (maturity_stage in ('concept', 'method', 'prototype', 'tested', 'deployed')),
  abstract text not null check (length(btrim(abstract)) between 120 and 3000),
  problem_statement text not null check (length(btrim(problem_statement)) between 80 and 2500),
  contribution_claim text not null check (length(btrim(contribution_claim)) between 50 and 2500),
  methodology text not null check (length(btrim(methodology)) between 100 and 4000),
  reproducibility_plan text not null check (length(btrim(reproducibility_plan)) between 100 and 4000),
  sources_and_artifacts jsonb not null default '[]'::jsonb check (jsonb_typeof(sources_and_artifacts) = 'array' and jsonb_array_length(sources_and_artifacts) <= 20),
  ethics_and_harm text not null check (length(btrim(ethics_and_harm)) between 80 and 3000),
  privacy_and_data text not null check (length(btrim(privacy_and_data)) between 80 and 3000),
  security_plan text not null check (length(btrim(security_plan)) between 80 and 2500),
  rights_and_ip text not null check (length(btrim(rights_and_ip)) between 80 and 2500),
  sustainability_plan text not null check (length(btrim(sustainability_plan)) between 60 and 2000),
  funding_and_conflicts text not null check (length(btrim(funding_and_conflicts)) between 30 and 1500),
  filter_declarations jsonb not null check (jsonb_typeof(filter_declarations) = 'object'),
  submitter_attested boolean not null default false check (submitter_attested = true),
  status text not null default 'received' check (status in (
    'received','administrative_screening','independent_review','minor_revision','major_revision',
    'accepted_with_conditions','rejected','suspended','withdrawn'
  )),
  risk_screening_status text not null default 'pending' check (risk_screening_status in ('pending','low','moderate','high','critical','not_assessed')),
  first_review_due_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (octet_length(abstract) + octet_length(problem_statement) + octet_length(contribution_claim) +
    octet_length(methodology) + octet_length(reproducibility_plan) + octet_length(ethics_and_harm) +
    octet_length(privacy_and_data) + octet_length(security_plan) + octet_length(rights_and_ip) +
    octet_length(sustainability_plan) + octet_length(funding_and_conflicts) <= 32000)
);

create index if not exists tamv_vetra_proposals_member_created_idx
  on public.tamv_vetra_proposals (submitted_by_tamv_id, created_at desc);
create index if not exists tamv_vetra_proposals_status_created_idx
  on public.tamv_vetra_proposals (status, created_at desc);
create index if not exists tamv_vetra_proposals_code_idx
  on public.tamv_vetra_proposals (proposal_code);

create table if not exists public.tamv_vetra_reviews (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.tamv_vetra_proposals(id) on delete restrict,
  reviewer_tamv_id text references public.tamv_members(tamv_id) on update restrict on delete set null,
  reviewer_role text not null check (length(btrim(reviewer_role)) between 2 and 120),
  independence_declaration jsonb not null check (jsonb_typeof(independence_declaration) = 'object'),
  domain_scores jsonb not null check (jsonb_typeof(domain_scores) = 'object'),
  recommendation text not null check (recommendation in ('minor_revision','major_revision','accept_with_conditions','reject','recuse')),
  rationale text not null check (length(btrim(rationale)) between 100 and 8000),
  evidence_references jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_references) = 'array' and jsonb_array_length(evidence_references) <= 40),
  review_version text not null default 'VETRA-Ω∞-SOVEREIGN-1.0',
  created_at timestamptz not null default now()
);
create index if not exists tamv_vetra_reviews_proposal_created_idx
  on public.tamv_vetra_reviews (proposal_id, created_at);

create table if not exists public.tamv_vetra_decisions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.tamv_vetra_proposals(id) on delete restrict,
  decision_status text not null check (decision_status in (
    'minor_revision','major_revision','accepted_with_conditions','rejected','suspended','withdrawn'
  )),
  quorum_size integer not null check (quorum_size between 0 and 30),
  conflict_checks_complete boolean not null default false,
  decision_rationale text not null check (length(btrim(decision_rationale)) between 100 and 8000),
  conditions jsonb not null default '[]'::jsonb check (jsonb_typeof(conditions) = 'array' and jsonb_array_length(conditions) <= 40),
  appeal_window_days integer not null default 30 check (appeal_window_days between 0 and 180),
  decided_by_tamv_id text references public.tamv_members(tamv_id) on update restrict on delete set null,
  policy_version text not null default 'CANON-VETRA-OMEGA-INFINITY-2026-V1.0',
  created_at timestamptz not null default now()
);
create index if not exists tamv_vetra_decisions_proposal_created_idx
  on public.tamv_vetra_decisions (proposal_id, created_at desc);

alter table public.tamv_vetra_proposals enable row level security;
alter table public.tamv_vetra_reviews enable row level security;
alter table public.tamv_vetra_decisions enable row level security;

revoke all on table public.tamv_vetra_proposals from public, anon, authenticated;
revoke all on table public.tamv_vetra_reviews from public, anon, authenticated;
revoke all on table public.tamv_vetra_decisions from public, anon, authenticated;

grant select, insert, update on table public.tamv_vetra_proposals to service_role;
grant select, insert on table public.tamv_vetra_reviews to service_role;
grant select, insert on table public.tamv_vetra_decisions to service_role;

comment on table public.tamv_vetra_proposals is 'Private VETRA proposal intake; receipt is not approval or publication.';
comment on table public.tamv_vetra_reviews is 'Private independent reviewer assessments; conflicts and domain scores are retained for audit.';
comment on table public.tamv_vetra_decisions is 'Append-only VETRA decision history; decision statements are human-authored and appealable.';
comment on column public.tamv_vetra_proposals.filter_declarations is 'Submitter declarations for the three gates; declarations do not represent independent passage or certification.';


-- Remove the direct member link and public display-name snapshot when a TAMV member is deleted.
-- The editorial/audit retention policy must separately define lawful retention of the proposal body.
create or replace function public.tamv_vetra_anonymize_on_member_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.tamv_vetra_proposals
     set submitted_by_tamv_id = null,
         submitter_display_name = 'Member withdrawn',
         updated_at = now()
   where submitted_by_tamv_id = old.tamv_id;
  return old;
end;
$$;

revoke all on function public.tamv_vetra_anonymize_on_member_delete() from public, anon, authenticated;
grant execute on function public.tamv_vetra_anonymize_on_member_delete() to service_role;

drop trigger if exists tamv_vetra_member_delete_anonymize on public.tamv_members;
create trigger tamv_vetra_member_delete_anonymize
before delete on public.tamv_members
for each row execute function public.tamv_vetra_anonymize_on_member_delete();

commit;
