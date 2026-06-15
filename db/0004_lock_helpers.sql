-- Special Zone 6 — lock role-check helpers from anonymous RPC probes.
-- Run in the Supabase SQL editor AFTER 0003_konjac_seed.sql.
--
-- The advisor flagged that has_role / is_staff / is_committee_or_admin are
-- callable through PostgREST by anon. They never return data, only a boolean
-- about role membership for a given UUID, but that's still disclosure we
-- don't want before launch.
--
-- These helpers are SECURITY DEFINER and are called from RLS policies as
-- `authenticated`, so revoking EXECUTE from public/anon does NOT affect
-- policy evaluation — only blocks the public RPC surface.

revoke execute on function public.has_role(uuid, public.app_role)   from public;
revoke execute on function public.has_role(uuid, public.app_role)   from anon;
revoke execute on function public.is_staff(uuid)                    from public;
revoke execute on function public.is_staff(uuid)                    from anon;
revoke execute on function public.is_committee_or_admin(uuid)       from public;
revoke execute on function public.is_committee_or_admin(uuid)       from anon;

grant  execute on function public.has_role(uuid, public.app_role)   to authenticated;
grant  execute on function public.is_staff(uuid)                    to authenticated;
grant  execute on function public.is_committee_or_admin(uuid)       to authenticated;
