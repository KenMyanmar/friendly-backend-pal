-- Special Zone 6 — public read access for marketplace, prices, demand, crops.
-- Run in the Supabase SQL editor AFTER 0001_init.sql.
-- profiles and user_roles stay staff-only — no anon access.

-- 1. GRANT SELECT to anon on the 4 public tables
grant select on public.crops       to anon;
grant select on public.price_board to anon;
grant select on public.listings    to anon;
grant select on public.demand      to anon;

-- 2. Replace "authenticated-only" SELECT policies with "anon + authenticated"

drop policy if exists "auth read crops"    on public.crops;
drop policy if exists "public read crops"  on public.crops;
create policy "public read crops"
  on public.crops for select
  to anon, authenticated
  using (true);

drop policy if exists "auth read prices"    on public.price_board;
drop policy if exists "public read prices"  on public.price_board;
create policy "public read prices"
  on public.price_board for select
  to anon, authenticated
  using (true);

drop policy if exists "auth read listings"    on public.listings;
drop policy if exists "public read listings"  on public.listings;
create policy "public read listings"
  on public.listings for select
  to anon, authenticated
  using (true);

drop policy if exists "auth read demand"    on public.demand;
drop policy if exists "public read demand"  on public.demand;
create policy "public read demand"
  on public.demand for select
  to anon, authenticated
  using (true);

-- 3. Confirm: no anon grants on profiles or user_roles (intentionally omitted).
-- 4. All INSERT/UPDATE/DELETE policies from 0001_init.sql remain unchanged
--    (staff-only writes via is_staff / is_committee_or_admin).
