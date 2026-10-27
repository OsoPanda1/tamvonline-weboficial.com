-- TAMV Online Network — authenticated ORCID linking for a registered member.
-- Requires the ORCID OAuth callback to verify the returned ORCID iD server-side.
begin;

create unique index if not exists tamv_orcid_verified_identity_unique_idx
  on public.tamv_member_identifiers (lower(normalized_value))
  where scheme='ORCID' and verification_status='verified';

create or replace function public.tamv_link_verified_orcid(
  p_auth0_sub text,
  p_orcid_url text
)
returns table (
  tamv_id text,
  orcid_url text,
  verification_status text,
  verified_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tamv_id text;
  v_identifier_id uuid;
  v_existing_value text;
  v_verified_at timestamptz;
begin
  if coalesce(auth.role(),'anon') <> 'service_role' then
    raise exception 'This function is server-only' using errcode='42501';
  end if;
  if p_auth0_sub is null or length(p_auth0_sub) not between 1 and 255 then
    raise exception 'Invalid authenticated identity';
  end if;
  if p_orcid_url is null or p_orcid_url !~ '^https://orcid\.org/[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$' then
    raise exception 'Invalid canonical ORCID URL';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_auth0_sub,0));
  select m.tamv_id into v_tamv_id
    from public.tamv_members m
   where m.auth0_sub=p_auth0_sub and m.email_verified is true
   for update;
  if v_tamv_id is null then
    raise exception 'A registered TAMV member with verified email is required';
  end if;

  if exists (
    select 1 from public.tamv_member_identifiers i
     where i.scheme='ORCID'
       and lower(i.normalized_value)=lower(p_orcid_url)
       and i.verification_status='verified'
       and i.tamv_id<>v_tamv_id
  ) then
    raise exception 'This ORCID iD is already linked to another verified TAMV profile';
  end if;

  select i.id,i.value into v_identifier_id,v_existing_value
    from public.tamv_member_identifiers i
   where i.tamv_id=v_tamv_id and i.scheme='ORCID'
     and i.verification_status='verified'
   limit 1 for update;

  if v_identifier_id is not null and lower(v_existing_value)<>lower(p_orcid_url) then
    raise exception 'A different verified ORCID is already linked. Contact the institutional privacy/help channel to correct it';
  end if;

  select i.id into v_identifier_id
    from public.tamv_member_identifiers i
   where i.tamv_id=v_tamv_id and i.scheme='ORCID'
     and lower(i.normalized_value)=lower(p_orcid_url)
   limit 1 for update;

  if v_identifier_id is null then
    insert into public.tamv_member_identifiers(
      tamv_id,scheme,value,normalized_value,verification_status,evidence_url,verified_by,verified_at,updated_at
    ) values (
      v_tamv_id,'ORCID',p_orcid_url,lower(p_orcid_url),'verified',p_orcid_url,'ORCID OAuth2',now(),now()
    ) returning id, tamv_member_identifiers.verified_at into v_identifier_id,v_verified_at;
  else
    update public.tamv_member_identifiers i
       set value=p_orcid_url,
           normalized_value=lower(p_orcid_url),
           verification_status='verified',
           evidence_url=p_orcid_url,
           verified_by='ORCID OAuth2',
           verified_at=now(),
           updated_at=now()
     where i.id=v_identifier_id
     returning i.verified_at into v_verified_at;
  end if;

  return query select v_tamv_id,p_orcid_url,'verified'::text,v_verified_at;
end;
$$;

revoke all on function public.tamv_link_verified_orcid(text,text) from public, anon, authenticated;
grant execute on function public.tamv_link_verified_orcid(text,text) to service_role;

commit;
