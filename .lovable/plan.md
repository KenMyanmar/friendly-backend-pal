## Status check

- **`db/0002_public_read.sql` in the workspace is clean** — no `drop PvP` typo. The 4 SELECT policies use `to anon, authenticated using (true)` exactly. Nothing to patch in the repo.
- **`db/0001_init.sql` is intact in the workspace** (266 lines, ends at the admin-grant comment block). The truncation was only in the chat paste; the source file is fine.

So the only repo fix the user worried about doesn't exist. Good.

## What I'll do once switched to build mode

### 1. Frontend `.select()` cross-check (no edits unless drift found)
Read in parallel and diff every column against `0001_init.sql`:
- `src/routes/index.tsx`, `market.tsx`, `prices.tsx`, `demand.tsx`, `calendar.tsx`
- `src/components/PublicCards.tsx`

If any `.select("col_that_does_not_exist")` shows up, fix it in the frontend (no schema change). Otherwise report clean.

### 2. New migration `db/0004_lock_helpers.sql` — anon lockdown on role helpers
User asked for this. Revokes anon/public EXECUTE on the three role-check helpers, keeps them callable by `authenticated` (so RLS policies that call `has_role` / `is_staff` / `is_committee_or_admin` keep working — RLS runs as the querying role).

```sql
revoke execute on function public.has_role(uuid, public.app_role)   from public, anon;
revoke execute on function public.is_staff(uuid)                    from public, anon;
revoke execute on function public.is_committee_or_admin(uuid)       from public, anon;

grant  execute on function public.has_role(uuid, public.app_role)   to authenticated;
grant  execute on function public.is_staff(uuid)                    to authenticated;
grant  execute on function public.is_committee_or_admin(uuid)       to authenticated;
```

User applies it the same way as 0001/0002/0003. RLS policies use these via `SECURITY DEFINER` server-side and against `auth.uid()` which is always an authenticated context, so revoking from `anon`/`public` has no effect on policy evaluation — only blocks the public RPC probe surface the advisor flagged.

### 3. What I won't touch
- No edits to `0001`, `0002`, `0003` (workspace copies match what was applied).
- No changes to `profiles` / `user_roles` grants.
- No service-role path, no schema redesign.

### Out of scope (next build, on user's signal)
"Rep CRUD" — staff entry forms for farmers, listings, prices. Separate request.

---

Ready to switch to build mode and execute steps 1 + 2.