-- [DEV ONLY] Jalankan manual di project Supabase dev. Jangan jalankan di produksi.
-- Data ini hanya untuk pengujian katalog, harga, dan stok.

with sample_products (id, category_slug, name, slug, description) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'bergo-non-karet',     'Contoh Bergo Non Karet',     'contoh-bergo-non-karet',     'Produk contoh untuk pengujian katalog.'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'bergo-karet',          'Contoh Bergo Karet',          'contoh-bergo-karet',          'Produk contoh untuk pengujian katalog.'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'pashmina-kaos-rayon',  'Contoh Pashmina Kaos Rayon',  'contoh-pashmina-kaos-rayon',  'Produk contoh untuk pengujian katalog.'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'pashmina-viscose',     'Contoh Pashmina Viscose',     'contoh-pashmina-viscose',     'Produk contoh untuk pengujian katalog.'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'paris-jadul',          'Contoh Paris Jadul',          'contoh-paris-jadul',          'Produk contoh untuk pengujian katalog.')
)
insert into public.products (id, category_id, name, slug, description)
select sp.id, c.id, sp.name, sp.slug, sp.description
from sample_products sp
join public.categories c on c.slug = sp.category_slug
on conflict (slug) do nothing;

with sample_variants (product_slug, sku, size, color_name, color_hex, price, compare_at_price, stock_quantity) as (
  values
    ('contoh-bergo-non-karet',    'DEV-BNK-S-HITAM', 'S', 'Hitam',  '#171717', 45000, null::integer, 8),
    ('contoh-bergo-non-karet',    'DEV-BNK-M-HITAM', 'M', 'Hitam',  '#171717', 45000, null::integer, 0),
    ('contoh-bergo-karet',        'DEV-BK-S-COKELAT', 'S', 'Cokelat','#8B5E3C', 50000, 60000,            5),
    ('contoh-pashmina-kaos-rayon','DEV-PKR-ABU',      null, 'Abu',  '#6B7280', 35000, null::integer,    12),
    ('contoh-pashmina-viscose',   'DEV-PV-KREM',      null, 'Krem', '#D6C2A1', 40000, null::integer,     3),
    ('contoh-paris-jadul',        'DEV-PJ-NAVY',      null, 'Navy', '#1E3A8A', 30000, null::integer,     6)
)
insert into public.product_variants
  (product_id, sku, size, color_name, color_hex, price, compare_at_price, stock_quantity)
select p.id, sv.sku, sv.size, sv.color_name, sv.color_hex, sv.price,
  sv.compare_at_price, sv.stock_quantity
from sample_variants sv
join public.products p on p.slug = sv.product_slug
on conflict (sku) do nothing;
