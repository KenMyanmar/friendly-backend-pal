-- Special Zone 6 — initial schema, RLS, and crop catalogue seed.
-- Run this in the Supabase SQL editor for project mnlaorsnnxkiblbkqged.
-- (We can't auto-apply because the project is connected via custom keys
-- rather than the Lovable Cloud integration.)

-- =============================================================
-- 1. ENUMS
-- =============================================================
do $$ begin
  create type public.app_role as enum ('farmer','buyer','committee','village_rep','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.listing_status as enum ('available','reserved','sold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.demand_status as enum ('open','matched','fulfilled');
exception when duplicate_object then null; end $$;

-- =============================================================
-- 2. user_roles  (separate table — never store role on profiles)
-- =============================================================
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all    on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "users read own roles" on public.user_roles;
create policy "users read own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

-- =============================================================
-- 3. SECURITY DEFINER helpers (search_path pinned — required)
-- =============================================================
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('committee','village_rep','admin')
  );
$$;

create or replace function public.is_committee_or_admin(_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('committee','admin')
  );
$$;

-- Admins can manage role grants
drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- =============================================================
-- 4. profiles
--    Every profile has its own id. user_id is non-null ONLY for staff
--    who actually sign in. Farmers/buyers are records created by reps.
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  full_name_my text,
  phone text,
  village text,
  township text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "auth can read profiles"     on public.profiles;
drop policy if exists "staff can write profiles"   on public.profiles;
drop policy if exists "self can update own profile" on public.profiles;

create policy "auth can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "staff can write profiles"
  on public.profiles for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "self can update own profile"
  on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================
-- 5. crops
-- =============================================================
create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_my text not null,
  category text not null,
  unit text not null default 'kg',
  gap_certified boolean not null default false,
  harvest_months int[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

grant select on public.crops to authenticated;
grant insert, update, delete on public.crops to authenticated;
grant all on public.crops to service_role;
alter table public.crops enable row level security;

drop policy if exists "auth read crops"         on public.crops;
drop policy if exists "committee writes crops"  on public.crops;

create policy "auth read crops"
  on public.crops for select to authenticated using (true);

create policy "committee writes crops"
  on public.crops for all to authenticated
  using (public.is_committee_or_admin(auth.uid()))
  with check (public.is_committee_or_admin(auth.uid()));

-- =============================================================
-- 6. listings
-- =============================================================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  farmer_profile_id uuid not null references public.profiles(id) on delete cascade,
  crop_id uuid not null references public.crops(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null default 'kg',
  price_per_unit numeric not null check (price_per_unit >= 0),
  available_from date,
  location text,
  status public.listing_status not null default 'available',
  posted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;

drop policy if exists "auth read listings"   on public.listings;
drop policy if exists "staff write listings" on public.listings;

create policy "auth read listings"
  on public.listings for select to authenticated using (true);

create policy "staff write listings"
  on public.listings for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- =============================================================
-- 7. demand
-- =============================================================
create table if not exists public.demand (
  id uuid primary key default gen_random_uuid(),
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  crop_id uuid not null references public.crops(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  target_price numeric check (target_price >= 0),
  needed_by date,
  status public.demand_status not null default 'open',
  posted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.demand to authenticated;
grant all on public.demand to service_role;
alter table public.demand enable row level security;

drop policy if exists "auth read demand"   on public.demand;
drop policy if exists "staff write demand" on public.demand;

create policy "auth read demand"
  on public.demand for select to authenticated using (true);

create policy "staff write demand"
  on public.demand for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- =============================================================
-- 8. price_board (one reference price per crop per month)
-- =============================================================
create table if not exists public.price_board (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id) on delete cascade,
  reference_price numeric not null check (reference_price >= 0),
  currency text not null default 'MMK',
  month date not null,  -- always first of month
  set_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (crop_id, month)
);

grant select on public.price_board to authenticated;
grant insert, update, delete on public.price_board to authenticated;
grant all on public.price_board to service_role;
alter table public.price_board enable row level security;

drop policy if exists "auth read prices"        on public.price_board;
drop policy if exists "committee writes prices" on public.price_board;

create policy "auth read prices"
  on public.price_board for select to authenticated using (true);

create policy "committee writes prices"
  on public.price_board for all to authenticated
  using (public.is_committee_or_admin(auth.uid()))
  with check (public.is_committee_or_admin(auth.uid()));

-- =============================================================
-- 9. Seed crop catalogue (idempotent on name_en)
-- =============================================================
insert into public.crops (name_en, name_my, category, unit, gap_certified, harvest_months, notes) values
  ('Avocado',          'ထောပတ်သီး',           'fruit',     'kg', false, '{9,10,11,12,1,2,3}',            'Flagship — longest season, fresh export + avocado oil'),
  ('Strawberry',       'စတော်ဘယ်ရီ',          'fruit',     'kg', false, '{1,2,3,4}',                     'Premium temperate fruit; fresh + jam/frozen'),
  ('Mango',            'သရက်သီး',             'fruit',     'kg', false, '{6,7}',                         'Premium varieties: Sein Ta Lone, Yin Kwal'),
  ('Pineapple',        'နာနတ်သီး',             'fruit',     'kg', false, '{7,8}',                         'Peaks with mango — July glut, processing window'),
  ('Maymyo fruit',     'ပန်းမေမြို့သီး',        'fruit',     'kg', false, '{7,8,9,10,11,12}',              'Temperate apple/peach type from the highlands'),
  ('Mixed vegetables', 'ဟင်းသီးဟင်းရွက်စုံ',    'vegetable', 'kg', false, '{1,2,3,4,5,6,7,8,9,10,11,12}',   'Year-round base supply; varies by month')
on conflict do nothing;

-- =============================================================
-- 10. Grant yourself admin AFTER first sign-in:
--   1. Sign up an account at /auth (or in Supabase dashboard → Authentication → Users → Add user).
--   2. Find your auth.users.id, then:
--      insert into public.user_roles (user_id, role) values ('<your-uuid>','admin');
-- =============================================================
