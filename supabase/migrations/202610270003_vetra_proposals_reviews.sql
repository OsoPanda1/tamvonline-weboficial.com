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


-- Atomic human decision: require three distinct non-recused reviewers and coverage of all 14 domains.
create or replace function public.tamv_vetra_finalize_decision(
  p_proposal_id uuid,
  p_decision_status text,
  p_quorum_size integer,
  p_conflict_checks_complete boolean,
  p_decision_rationale text,
  p_conditions jsonb,
  p_appeal_window_days integer,
  p_decided_by_tamv_id text,
  p_policy_version text
)
returns table(id uuid, proposal_id uuid, decision_status text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_review_count integer;
  v_domain text;
  v_critical boolean;
  v_decision_id uuid;
  v_created_at timestamptz;
begin
  if p_decision_status not in ('minor_revision','major_revision','accepted_with_conditions','rejected','suspended','withdrawn') then
    raise exception 'Invalid VETRA decision status';
  end if;
  if p_conflict_checks_complete is not true then
    raise exception 'Conflict-of-interest checks must be completed before a VETRA decision';
  end if;
  if p_quorum_size < 3 or p_quorum_size > 30 then
    raise exception 'VETRA decision requires at least three independent reviewers';
  end if;
  if length(btrim(coalesce(p_decision_rationale,''))) < 100 or length(p_decision_rationale) > 8000 then
    raise exception 'Decision rationale must contain 100 to 8000 characters';
  end if;
  if jsonb_typeof(coalesce(p_conditions,'[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_conditions,'[]'::jsonb)) > 40 then
    raise exception 'Invalid VETRA decision conditions';
  end if;
  if p_appeal_window_days < 0 or p_appeal_window_days > 180 then
    raise exception 'Appeal window must be between 0 and 180 days';
  end if;

  perform 1 from public.tamv_vetra_proposals where tamv_vetra_proposals.id=p_proposal_id for update;
  if not found then raise exception 'VETRA proposal not found'; end if;
  if exists (select 1 from public.tamv_vetra_decisions where tamv_vetra_decisions.proposal_id=p_proposal_id) then
    raise exception 'A final VETRA decision already exists for this proposal version';
  end if;

  with latest_reviews as (
    select distinct on (reviewer_tamv_id) reviewer_tamv_id, recommendation, independence_declaration, domain_scores
      from public.tamv_vetra_reviews
      where tamv_vetra_reviews.proposal_id=p_proposal_id and reviewer_tamv_id is not null
      order by reviewer_tamv_id, created_at desc
  )
  select count(*) into v_review_count from latest_reviews
   where recommendation <> 'recuse'
     and coalesce((independence_declaration->>'hasConflict')::boolean,false)=false
     and coalesce((independence_declaration->>'financialInterest')::boolean,false)=false
     and coalesce((independence_declaration->>'involvedInDevelopment')::boolean,false)=false
     and coalesce((independence_declaration->>'recentCollaboration')::boolean,false)=false
     and coalesce(nullif(btrim(independence_declaration->>'otherRelationship'),''),'')='';

  if v_review_count < 3 then
    raise exception 'At least three distinct non-recused reviewers with clear conflict declarations are required';
  end if;
  if p_quorum_size <> v_review_count then
    raise exception 'Declared quorum does not match the number of eligible distinct reviewers';
  end if;

  foreach v_domain in array array[
    'scientificValidity','technicalRobustness','security','privacy','ethics','reproducibility',
    'governance','socialImpact','economicViability','scientificIntegrity','cognitiveReliability',
    'metaEvaluation','evidenceProvenance','futureConsequences'
  ]
  loop
    with latest_reviews as (
      select distinct on (reviewer_tamv_id) reviewer_tamv_id, recommendation, domain_scores
        from public.tamv_vetra_reviews
        where tamv_vetra_reviews.proposal_id=p_proposal_id and reviewer_tamv_id is not null
        order by reviewer_tamv_id, created_at desc
    )
    select exists(
      select 1 from latest_reviews
       where recommendation <> 'recuse'
         and coalesce(domain_scores->'scores','{}'::jsonb) ? v_domain
    ) into v_critical;
    if not v_critical then
      raise exception 'No eligible review covers required domain %', v_domain;
    end if;
  end loop;

  with latest_reviews as (
    select distinct on (reviewer_tamv_id) reviewer_tamv_id, recommendation, domain_scores
      from public.tamv_vetra_reviews
      where tamv_vetra_reviews.proposal_id=p_proposal_id and reviewer_tamv_id is not null
      order by reviewer_tamv_id, created_at desc
  )
  select exists(
    select 1 from latest_reviews
     where recommendation <> 'recuse'
       and jsonb_typeof(coalesce(domain_scores->'criticalFailures','[]'::jsonb))='array'
       and jsonb_array_length(coalesce(domain_scores->'criticalFailures','[]'::jsonb)) > 0
  ) into v_critical;

  if p_decision_status='accepted_with_conditions' and v_critical then
    raise exception 'A proposal with unresolved critical failures cannot be accepted';
  end if;

  insert into public.tamv_vetra_decisions(
    proposal_id,decision_status,quorum_size,conflict_checks_complete,decision_rationale,
    conditions,appeal_window_days,decided_by_tamv_id,policy_version
  ) values (
    p_proposal_id,p_decision_status,v_review_count,true,p_decision_rationale,
    coalesce(p_conditions,'[]'::jsonb),p_appeal_window_days,p_decided_by_tamv_id,
    coalesce(nullif(p_policy_version,''),'CANON-VETRA-OMEGA-INFINITY-2026-V1.0')
  ) returning tamv_vetra_decisions.id, tamv_vetra_decisions.created_at into v_decision_id,v_created_at;

  update public.tamv_vetra_proposals
    set status=p_decision_status, reviewed_at=v_created_at, updated_at=v_created_at
    where tamv_vetra_proposals.id=p_proposal_id;

  return query select v_decision_id,p_proposal_id,p_decision_status,v_created_at;
end;
$$;

revoke all on function public.tamv_vetra_finalize_decision(uuid,text,integer,boolean,text,jsonb,integer,text,text) from public, anon, authenticated;
grant execute on function public.tamv_vetra_finalize_decision(uuid,text,integer,boolean,text,jsonb,integer,text,text) to service_role;


-- Atomic submission and per-member rate limit. This closes the race between counting submissions and inserting one.
create or replace function public.tamv_vetra_submit_proposal(
  p_submitted_by_tamv_id text,
  p_submitter_display_name text,
  p_title text,
  p_proposal_type text,
  p_maturity_stage text,
  p_abstract text,
  p_problem_statement text,
  p_contribution_claim text,
  p_methodology text,
  p_reproducibility_plan text,
  p_sources_and_artifacts jsonb,
  p_ethics_and_harm text,
  p_privacy_and_data text,
  p_security_plan text,
  p_rights_and_ip text,
  p_sustainability_plan text,
  p_funding_and_conflicts text,
  p_filter_declarations jsonb,
  p_submitter_attested boolean
)
returns table(id uuid, proposal_code text, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recent_count integer;
  v_id uuid;
  v_proposal_code text;
  v_status text;
  v_created_at timestamptz;
begin
  if p_submitted_by_tamv_id is null or p_submitted_by_tamv_id !~ '^TAMV-[0-9A-F]{26}$' then
    raise exception 'Invalid TAMV member identifier';
  end if;
  if p_submitter_attested is not true then
    raise exception 'Submitter attestation is required';
  end if;
  if jsonb_typeof(coalesce(p_sources_and_artifacts,'[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_sources_and_artifacts,'[]'::jsonb)) > 20 then
    raise exception 'Invalid proposal references';
  end if;
  if jsonb_typeof(coalesce(p_filter_declarations,'{}'::jsonb)) <> 'object'
     or coalesce((p_filter_declarations->>'filter1IntegrityAndProvenance')::boolean,false) is not true
     or coalesce((p_filter_declarations->>'filter2MethodAndReproducibility')::boolean,false) is not true
     or coalesce((p_filter_declarations->>'filter3ResponsibleUseAndRights')::boolean,false) is not true
     or coalesce((p_filter_declarations->>'understandsDeclarationsAreNotApproval')::boolean,false) is not true then
    raise exception 'All three VETRA gate declarations are required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_submitted_by_tamv_id, 0));
  select count(*) into v_recent_count
    from public.tamv_vetra_proposals
   where submitted_by_tamv_id=p_submitted_by_tamv_id
     and created_at >= now() - interval '24 hours';
  if v_recent_count >= 3 then
    raise exception 'VETRA proposal rate limit reached: three proposals per member in 24 hours';
  end if;

  insert into public.tamv_vetra_proposals(
    submitted_by_tamv_id,submitter_display_name,title,proposal_type,maturity_stage,abstract,
    problem_statement,contribution_claim,methodology,reproducibility_plan,sources_and_artifacts,
    ethics_and_harm,privacy_and_data,security_plan,rights_and_ip,sustainability_plan,
    funding_and_conflicts,filter_declarations,submitter_attested,status,risk_screening_status
  ) values (
    p_submitted_by_tamv_id,p_submitter_display_name,p_title,p_proposal_type,p_maturity_stage,p_abstract,
    p_problem_statement,p_contribution_claim,p_methodology,p_reproducibility_plan,
    coalesce(p_sources_and_artifacts,'[]'::jsonb),p_ethics_and_harm,p_privacy_and_data,p_security_plan,
    p_rights_and_ip,p_sustainability_plan,p_funding_and_conflicts,p_filter_declarations,true,'received','pending'
  ) returning tamv_vetra_proposals.id,tamv_vetra_proposals.proposal_code,
            tamv_vetra_proposals.status,tamv_vetra_proposals.created_at
       into v_id,v_proposal_code,v_status,v_created_at;

  return query select v_id,v_proposal_code,v_status,v_created_at;
end;
$$;

revoke all on function public.tamv_vetra_submit_proposal(text,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.tamv_vetra_submit_proposal(text,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,jsonb,boolean) to service_role;

commit;
