-- Run after applying the TAMV identity registry migration in the target Supabase project.
-- These checks are read-only and do not create a test member or expose profile data.
do $$
declare
  rls_enabled boolean;
  has_public_select boolean;
  has_anon_select boolean;
  has_authenticated_select boolean;
  service_can_execute boolean;
  anon_can_execute boolean;
  authenticated_can_execute boolean;
begin
  select c.relrowsecurity into rls_enabled
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'tamv_members';
  if coalesce(rls_enabled, false) is not true then
    raise exception 'FAIL: RLS is not enabled on public.tamv_members';
  end if;

  select has_table_privilege('public', 'public.tamv_members', 'SELECT') into has_public_select;
  select has_table_privilege('anon', 'public.tamv_members', 'SELECT') into has_anon_select;
  select has_table_privilege('authenticated', 'public.tamv_members', 'SELECT') into has_authenticated_select;
  if has_public_select or has_anon_select or has_authenticated_select then
    raise exception 'FAIL: public, anon or authenticated role can select private member records';
  end if;

  select has_function_privilege('service_role', 'public.tamv_register_member(text,text,boolean,boolean,text,text,text,text,text[],text,boolean,text,text,jsonb)', 'EXECUTE')
    into service_can_execute;
  select has_function_privilege('anon', 'public.tamv_register_member(text,text,boolean,boolean,text,text,text,text,text[],text,boolean,text,text,jsonb)', 'EXECUTE')
    into anon_can_execute;
  select has_function_privilege('authenticated', 'public.tamv_register_member(text,text,boolean,boolean,text,text,text,text,text[],text,boolean,text,text,jsonb)', 'EXECUTE')
    into authenticated_can_execute;

  if service_can_execute is not true then raise exception 'FAIL: service_role cannot execute registration RPC'; end if;
  if anon_can_execute or authenticated_can_execute then raise exception 'FAIL: browser-facing role can execute registration RPC'; end if;
  raise notice 'PASS: TAMV private member RLS/grants and registration RPC privileges are configured as expected.';
end $$;
