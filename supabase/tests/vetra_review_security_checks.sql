-- Read-only VETRA proposal/review privilege check.
-- Run only after applying migration 202610270003_vetra_proposals_reviews.sql.
do $$
declare
  proposals_rls boolean;
  reviews_rls boolean;
  decisions_rls boolean;
  anonymize_trigger_exists boolean;
  svc_insert_proposals boolean;
  svc_insert_reviews boolean;
  svc_insert_decisions boolean;
  anon_select_proposals boolean;
  anon_insert_proposals boolean;
  auth_select_proposals boolean;
  auth_insert_proposals boolean;
  anon_select_reviews boolean;
  auth_select_reviews boolean;
  anon_select_decisions boolean;
  auth_select_decisions boolean;
begin
  select relrowsecurity into proposals_rls
    from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where nspname='public' and relname='tamv_vetra_proposals';
  select relrowsecurity into reviews_rls
    from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where nspname='public' and relname='tamv_vetra_reviews';
  select relrowsecurity into decisions_rls
    from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where nspname='public' and relname='tamv_vetra_decisions';

  if coalesce(proposals_rls,false) is not true then raise exception 'FAIL: RLS missing on tamv_vetra_proposals'; end if;
  if coalesce(reviews_rls,false) is not true then raise exception 'FAIL: RLS missing on tamv_vetra_reviews'; end if;
  if coalesce(decisions_rls,false) is not true then raise exception 'FAIL: RLS missing on tamv_vetra_decisions'; end if;
  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='tamv_members'
      and t.tgname='tamv_vetra_member_delete_anonymize' and not t.tgisinternal
  ) into anonymize_trigger_exists;
  if anonymize_trigger_exists is not true then raise exception 'FAIL: VETRA member-deletion anonymization trigger is missing'; end if;

  select has_table_privilege('service_role','public.tamv_vetra_proposals','INSERT') into svc_insert_proposals;
  select has_table_privilege('service_role','public.tamv_vetra_reviews','INSERT') into svc_insert_reviews;
  select has_table_privilege('service_role','public.tamv_vetra_decisions','INSERT') into svc_insert_decisions;

  select has_table_privilege('anon','public.tamv_vetra_proposals','SELECT') into anon_select_proposals;
  select has_table_privilege('anon','public.tamv_vetra_proposals','INSERT') into anon_insert_proposals;
  select has_table_privilege('authenticated','public.tamv_vetra_proposals','SELECT') into auth_select_proposals;
  select has_table_privilege('authenticated','public.tamv_vetra_proposals','INSERT') into auth_insert_proposals;
  select has_table_privilege('anon','public.tamv_vetra_reviews','SELECT') into anon_select_reviews;
  select has_table_privilege('authenticated','public.tamv_vetra_reviews','SELECT') into auth_select_reviews;
  select has_table_privilege('anon','public.tamv_vetra_decisions','SELECT') into anon_select_decisions;
  select has_table_privilege('authenticated','public.tamv_vetra_decisions','SELECT') into auth_select_decisions;

  if svc_insert_proposals is not true or svc_insert_reviews is not true or svc_insert_decisions is not true then
    raise exception 'FAIL: service_role lacks expected VETRA insert grants';
  end if;
  if anon_select_proposals or anon_insert_proposals or auth_select_proposals or auth_insert_proposals
     or anon_select_reviews or auth_select_reviews or anon_select_decisions or auth_select_decisions then
    raise exception 'FAIL: public/anon/authenticated roles can access private VETRA records';
  end if;

  if not has_function_privilege('service_role', 'public.tamv_vetra_submit_proposal(text,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,jsonb,boolean)', 'EXECUTE') then
    raise exception 'FAIL: service_role cannot execute atomic VETRA proposal submission RPC';
  end if;
  if has_function_privilege('anon', 'public.tamv_vetra_submit_proposal(text,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,jsonb,boolean)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.tamv_vetra_submit_proposal(text,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,text,text,jsonb,boolean)', 'EXECUTE') then
    raise exception 'FAIL: browser-facing role can execute VETRA proposal submission RPC';
  end if;
  if not has_function_privilege('service_role', 'public.tamv_vetra_finalize_decision(uuid,text,integer,boolean,text,jsonb,integer,text,text)', 'EXECUTE') then
    raise exception 'FAIL: service_role cannot execute atomic VETRA final-decision RPC';
  end if;
  if has_function_privilege('anon', 'public.tamv_vetra_finalize_decision(uuid,text,integer,boolean,text,jsonb,integer,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.tamv_vetra_finalize_decision(uuid,text,integer,boolean,text,jsonb,integer,text,text)', 'EXECUTE') then
    raise exception 'FAIL: browser-facing role can execute VETRA final-decision RPC';
  end if;
  raise notice 'PASS: VETRA tables have RLS, server-only inserts/RPCs, and no browser-facing grants.';
end $$;
