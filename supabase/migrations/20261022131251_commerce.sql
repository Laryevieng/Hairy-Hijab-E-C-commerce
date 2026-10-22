create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  province text not null unique,                             -- '*' = tarif default
  label text not null default 'Tarif flat',
  cost integer not null check (cost >= 0),
  estimated_days text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shipping_rates enable row level security;

create trigger trg_shipping_rates_updated before update on public.shipping_rates
  for each row execute function public.set_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  idempotency_key uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,           -- null = tamu
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  subtotal integer not null default 0 check (subtotal >= 0),
  shipping_cost integer not null default 0 check (shipping_cost >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  grand_total integer not null default 0 check (grand_total >= 0),
  customer_name_snapshot text not null,
  customer_phone_snapshot text not null,
  customer_email_snapshot text,
  shipping_address_snapshot jsonb not null,
  notes text,
  cancel_reason text,
  expires_at timestamptz not null,
  stock_released_at timestamptz,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_order_total check (grand_total = subtotal + shipping_cost - discount_amount)
);
alter table public.orders enable row level security;

create index idx_orders_user on public.orders(user_id, created_at desc);
create index idx_orders_status on public.orders(status, created_at desc);
create index idx_orders_expiry on public.orders(expires_at)
  where status = 'pending' and payment_status = 'unpaid';
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  size_snapshot text,
  color_snapshot text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total integer not null,
  constraint chk_line_total check (line_total = unit_price * quantity)
);
alter table public.order_items enable row level security;

create index idx_order_items_order on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  from_payment_status public.payment_status,
  to_payment_status public.payment_status not null,
  actor_id uuid,                                              -- null = sistem/tamu
  created_at timestamptz not null default now()
);
alter table public.order_status_history enable row level security;

create index idx_order_history_order on public.order_status_history(order_id, created_at);

-- Satu baris = satu percobaan pembayaran (riwayat). Netral terhadap provider (D-10).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null default 'bank_transfer',
  provider text,
  provider_reference text,
  amount integer not null check (amount >= 0),
  status public.payment_record_status not null default 'pending',
  proof_path text,                                            -- path di bucket payment-proofs
  bank_name text,
  sender_name text,
  customer_note text,
  review_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments enable row level security;

create index idx_payments_order on public.payments(order_id);
create unique index uq_payments_provider_ref on public.payments(provider, provider_reference)
  where provider is not null;                                  -- idempotensi webhook kelak
create trigger trg_payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  courier text not null,
  service text,
  tracking_number text,
  status public.shipment_status not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shipments enable row level security;

create trigger trg_shipments_updated before update on public.shipments
  for each row execute function public.set_updated_at();

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type public.stock_movement_type not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_after integer not null check (stock_after >= 0),
  order_id uuid references public.orders(id) on delete set null,
  reason text,
  actor_id uuid,
  created_at timestamptz not null default now()
);
alter table public.stock_movements enable row level security;

create index idx_stock_movements_variant on public.stock_movements(variant_id, created_at desc);
