-- TAMV Online Network — persistent member identity registry
-- Apply through the Supabase SQL Editor or Supabase CLI migration workflow.
-- The application uses Auth0 for identity and a server-only Supabase key for database access.
-- DO NOT expose SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY to a browser.

begin;

create table if not exists public.tamv_id_registry (
  tamv_id text primary key check (tamv_id ~ '^TAMV-[0-9A-F]{26}$'),
  status text not null default 'active' check (status in ('active', 'withdrawn')),
  issued_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  check ((status = 'active' and withdrawn_at is null) or (status = 'withdrawn' and withdrawn_at is not null))
);

create table if not exists public.tamv_members (
  id uuid primary key default gen_random_uuid(),
  tamv_id text not null unique references public.tamv_id_registry(tamv_id) on update restrict on delete restrict,
  auth0_sub text not null unique check (length(auth0_sub) between 1 and 255),
  email text not null check (length(email) between 3 and 320),
  email_verified boolean not null default false,
  adult_confirmed boolean not null default false,
  display_name text not null check (length(btrim(display_name)) between 2 and 100),
  bio text check (bio is null or length(bio) <= 600),
  affiliation text check (affiliation is null or length(affiliation) <= 180),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  research_areas text[] not null default '{}',
  profile_visibility text not null default 'private' check (profile_visibility in ('private', 'public')),
  public_profile_consent boolean not null default false,
  membership_status text not null default 'pending_review'
    check (membership_status in ('pending_review', 'approved', 'suspended', 'rejected')),
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  privacy_version text not null,
  privacy_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (profile_visibility <> 'public' or public_profile_consent = true),
  check (cardinality(research_areas) <= 8)
);

create table if not exists public.tamv_member_identifiers (
  id uuid primary key default gen_random_uuid(),
  tamv_id text not null references public.tamv_members(tamv_id) on update restrict on delete cascade,
  scheme text not null check (scheme in ('ORCID', 'ISNI', 'GITHUB', 'WEBSITE')),
  value text not null check (length(btrim(value)) between 1 and 500),
  normalized_value text not null check (length(btrim(normalized_value)) between 1 and 500),
  verification_status text not null default 'declared'
    check (verification_status in ('declared', 'pending', 'verified', 'rejected')),
  evidence_url text,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tamv_id, scheme, normalized_value),
  check ((verification_status = 'verified' and verified_at is not null) or verification_status <> 'verified')
);

create index if not exists tamv_members_public_lookup_idx
  on public.tamv_members (tamv_id, profile_visibility, membership_status);
create index if not exists tamv_members_created_idx
  on public.tamv_members (created_at desc);
create index if not exists tamv_member_identifiers_tamv_id_idx
  on public.tamv_member_identifiers (tamv_id);
create index if not exists tamv_members_research_areas_idx
  on public.tamv_members using gin (research_areas);

create or replace function public.tamv_assign_id_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  candidate text;
begin
  if new.tamv_id is not null then
    raise exception 'TAMV IDs are assigned by the database only';
  end if;

  loop
    candidate := 'TAMV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 26));
    insert into public.tamv_id_registry (tamv_id, status) values (candidate, 'active')
    on conflict (tamv_id) do nothing;
    if found then
      new.tamv_id := candidate;
      exit;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists tamv_assign_id_before_insert_trigger on public.tamv_members;
create trigger tamv_assign_id_before_insert_trigger
before insert on public.tamv_members
for each row execute function public.tamv_assign_id_before_insert();

create or replace function public.tamv_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tamv_members_updated_at_trigger on public.tamv_members;
create trigger tamv_members_updated_at_trigger
before update on public.tamv_members
for each row execute function public.tamv_set_updated_at();

drop trigger if exists tamv_member_identifiers_updated_at_trigger on public.tamv_member_identifiers;
create trigger tamv_member_identifiers_updated_at_trigger
before update on public.tamv_member_identifiers
for each row execute function public.tamv_set_updated_at();

create or replace function public.tamv_register_member(
  p_auth0_sub text,
  p_email text,
  p_email_verified boolean,
  p_adult_confirmed boolean,
  p_display_name text,
  p_bio text,
  p_affiliation text,
  p_country_code text,
  p_research_areas text[],
  p_profile_visibility text,
  p_public_profile_consent boolean,
  p_terms_version text,
  p_privacy_version text,
  p_identifiers jsonb default '[]'::jsonb
)
returns table (
  tamv_id text,
  display_name text,
  membership_status text,
  profile_visibility text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tamv_id text;
  v_identifier jsonb;
  v_scheme text;
  v_value text;
  v_normalized text;
begin
  if coalesce(auth.role(), 'anon') <> 'service_role' then
    raise exception 'This function is server-only' using errcode = '42501';
  end if;
  if p_auth0_sub is null or length(p_auth0_sub) not between 1 and 255 then
    raise exception 'Invalid identity subject';
  end if;
  if p_email is null or length(p_email) not between 3 and 320 or p_email_verified is distinct from true then
    raise exception 'A verified email address is required';
  end if;
  if p_adult_confirmed is distinct from true then
    raise exception 'The initial TAMV membership flow requires an adult age confirmation';
  end if;
  if p_display_name is null or length(btrim(p_display_name)) not between 2 and 100 then
    raise exception 'Display name must contain 2 to 100 characters';
  end if;
  if coalesce(length(p_bio), 0) > 600 or coalesce(length(p_affiliation), 0) > 180 then
    raise exception 'Profile field is too long';
  end if;
  if p_profile_visibility not in ('private', 'public') then
    raise exception 'Invalid profile visibility';
  end if;
  if p_profile_visibility = 'public' and p_public_profile_consent is distinct from true then
    raise exception 'Public profile consent is required';
  end if;
  if p_terms_version is null or p_privacy_version is null then
    raise exception 'Current terms and privacy versions are required';
  end if;
  if coalesce(cardinality(p_research_areas), 0) > 8 then
    raise exception 'At most eight research areas may be recorded';
  end if;

  -- Serialize writes per Auth0 subject to avoid duplicate IDs from simultaneous registration requests.
  perform pg_advisory_xact_lock(hashtextextended(p_auth0_sub, 0));
  select m.tamv_id into v_tamv_id
  from public.tamv_members as m
  where m.auth0_sub = p_auth0_sub
  for update;

  if v_tamv_id is null then
    insert into public.tamv_members (
      auth0_sub, email, email_verified, adult_confirmed, display_name, bio, affiliation, country_code,
      research_areas, profile_visibility, public_profile_consent,
      terms_version, terms_accepted_at, privacy_version, privacy_accepted_at
    ) values (
      p_auth0_sub, lower(p_email), true, true, btrim(p_display_name), nullif(btrim(p_bio), ''),
      nullif(btrim(p_affiliation), ''), nullif(upper(btrim(p_country_code)), ''),
      coalesce(p_research_areas, '{}'), p_profile_visibility, p_public_profile_consent,
      p_terms_version, now(), p_privacy_version, now()
    ) returning public.tamv_members.tamv_id into v_tamv_id;
  else
    update public.tamv_members as m set
      email = lower(p_email), email_verified = true, adult_confirmed = true, display_name = btrim(p_display_name),
      bio = nullif(btrim(p_bio), ''), affiliation = nullif(btrim(p_affiliation), ''),
      country_code = nullif(upper(btrim(p_country_code)), ''),
      research_areas = coalesce(p_research_areas, '{}'),
      profile_visibility = p_profile_visibility,
      public_profile_consent = p_public_profile_consent,
      terms_version = p_terms_version, terms_accepted_at = now(),
      privacy_version = p_privacy_version, privacy_accepted_at = now()
    where m.auth0_sub = p_auth0_sub
    returning m.tamv_id into v_tamv_id;
  end if;

  -- Preserve prior verification if an identifier is unchanged; remove values the member removed.
  delete from public.tamv_member_identifiers as existing
  where existing.tamv_id = v_tamv_id
    and not exists (
      select 1 from jsonb_array_elements(coalesce(p_identifiers, '[]'::jsonb)) as incoming(item)
      where upper(incoming.item->>'scheme') = existing.scheme
        and lower(incoming.item->>'normalized_value') = lower(existing.normalized_value)
    );

  for v_identifier in select value from jsonb_array_elements(coalesce(p_identifiers, '[]'::jsonb))
  loop
    v_scheme := upper(coalesce(v_identifier->>'scheme', ''));
    v_value := btrim(coalesce(v_identifier->>'value', ''));
    v_normalized := lower(btrim(coalesce(v_identifier->>'normalized_value', '')));
    if v_scheme not in ('ORCID', 'ISNI', 'GITHUB', 'WEBSITE') or v_value = '' or v_normalized = '' then
      raise exception 'Invalid identifier payload';
    end if;
    insert into public.tamv_member_identifiers (tamv_id, scheme, value, normalized_value, verification_status)
    values (v_tamv_id, v_scheme, v_value, v_normalized, 'declared')
    on conflict (tamv_id, scheme, normalized_value)
    do update set value = excluded.value, updated_at = now();
  end loop;

  return query
  select m.tamv_id, m.display_name, m.membership_status, m.profile_visibility, m.created_at, m.updated_at
  from public.tamv_members as m where m.auth0_sub = p_auth0_sub;
end;
$$;

create or replace function public.tamv_delete_member(p_auth0_sub text)
returns table (tamv_id text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tamv_id text;
begin
  if coalesce(auth.role(), 'anon') <> 'service_role' then
    raise exception 'This function is server-only' using errcode = '42501';
  end if;
  select m.tamv_id into v_tamv_id from public.tamv_members as m where m.auth0_sub = p_auth0_sub for update;
  if v_tamv_id is null then
    return;
  end if;

  delete from public.tamv_member_identifiers where public.tamv_member_identifiers.tamv_id = v_tamv_id;
  delete from public.tamv_members where public.tamv_members.tamv_id = v_tamv_id;
  update public.tamv_id_registry set status = 'withdrawn', withdrawn_at = now() where public.tamv_id_registry.tamv_id = v_tamv_id;
  return query select v_tamv_id;
end;
$$;

alter table public.tamv_id_registry enable row level security;
alter table public.tamv_members enable row level security;
alter table public.tamv_member_identifiers enable row level security;

revoke all on table public.tamv_id_registry from public, anon, authenticated;
revoke all on table public.tamv_members from public, anon, authenticated;
revoke all on table public.tamv_member_identifiers from public, anon, authenticated;
grant select, insert, update, delete on table public.tamv_id_registry to service_role;
grant select, insert, update, delete on table public.tamv_members to service_role;
grant select, insert, update, delete on table public.tamv_member_identifiers to service_role;

revoke all on function public.tamv_register_member(text,text,boolean,boolean,text,text,text,text,text[],text,boolean,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.tamv_register_member(text,text,boolean,boolean,text,text,text,text,text[],text,boolean,text,text,jsonb) to service_role;
revoke all on function public.tamv_delete_member(text) from public, anon, authenticated;
grant execute on function public.tamv_delete_member(text) to service_role;

commit;
