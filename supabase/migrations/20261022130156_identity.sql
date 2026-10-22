create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role HANYA di sini. Tidak ada policy tulis untuk klien; diisi pemilik lewat SQL.
create table public.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.staff_role not null,
  created_at timestamptz not null default now()
);
alter table public.staff_roles enable row level security;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles where user_id = (select auth.uid()));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles
                  where user_id = (select auth.uid()) and role = 'admin');
$$;

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  province text not null,
  city text not null,
  district text not null,
  postal_code text not null,
  address_detail text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.addresses enable row level security;

create index idx_addresses_user on public.addresses(user_id);
create unique index uq_addresses_one_default on public.addresses(user_id) where is_default;
create trigger trg_addresses_updated before update on public.addresses
  for each row execute function public.set_updated_at();

create or replace function public.enforce_single_default_address() returns trigger
language plpgsql as $$
begin
  update public.addresses set is_default = false
   where user_id = new.user_id and id <> new.id and is_default;
  return new;
end $$;
create trigger trg_addresses_default before insert or update of is_default on public.addresses
  for each row when (new.is_default) execute function public.enforce_single_default_address();
