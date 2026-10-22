create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  requires_size boolean not null default false,
  size_options text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.categories enable row level security;

create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  material text,
  care_instructions text,
  specs jsonb not null default '{}'::jsonb,                  -- tampilan saja, mis. {"dimensi":"110x110 cm"}
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create index idx_products_category on public.products(category_id);
create index idx_products_active_created on public.products(is_active, created_at desc);
create index idx_products_name_trgm on public.products using gin (name extensions.gin_trgm_ops);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color_name text,
  color_hex text   check (color_hex   is null or color_hex   ~ '^#[0-9A-Fa-f]{6}$'),
  color_hex_2 text check (color_hex_2 is null or color_hex_2 ~ '^#[0-9A-Fa-f]{6}$'),  -- warna kedua (Two Tone)
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price > price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_variant_combo unique nulls not distinct (product_id, size, color_name)
);
alter table public.product_variants enable row level security;

create index idx_variants_product on public.product_variants(product_id);
create trigger trg_variants_updated before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  storage_path text not null,                                -- path di bucket product-images
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.product_images enable row level security;

create index idx_images_product on public.product_images(product_id, sort_order);
