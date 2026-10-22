create extension if not exists pg_trgm with schema extensions;

create type public.staff_role           as enum ('admin', 'staff');
create type public.order_status         as enum ('pending','processing','shipped','completed','cancelled','expired');
create type public.payment_status       as enum ('unpaid','proof_submitted','paid','refunded');
create type public.payment_record_status as enum ('pending','submitted','verified','rejected');
create type public.shipment_status      as enum ('pending','shipped','delivered','returned');
create type public.stock_movement_type  as enum ('initial','restock','adjustment','reserve','release');

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Kode acak tanpa karakter membingungkan (tanpa I, L, O, 0, 1)
create or replace function public.random_code(p_length int) returns text
language plpgsql volatile as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_result text := '';
begin
  for i in 1..p_length loop
    v_result := v_result || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  return v_result;
end $$;

create table public.store_settings (
  id smallint primary key default 1 check (id = 1),         -- satu baris saja
  store_name text not null default 'Hairy Hijab',
  contact_whatsapp text,
  contact_email text,
  address text,
  logo_path text,
  bank_accounts jsonb not null default '[]'::jsonb,         -- [{bank, account_number, account_name}]
  payment_expiry_hours integer not null default 24 check (payment_expiry_hours between 1 and 168),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;

create trigger trg_store_settings_updated before update on public.store_settings
  for each row execute function public.set_updated_at();
