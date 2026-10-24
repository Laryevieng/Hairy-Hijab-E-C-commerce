create view public.product_listing
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.category_id,
  c.slug as category_slug,
  p.is_featured,
  p.created_at,
  min(v.price) as min_price,
  max(v.price) as max_price,
  coalesce(bool_or(v.is_active and v.stock_quantity > 0), false) as in_stock,
  coalesce(bool_or(v.is_active and v.compare_at_price is not null), false) as on_sale,
  (
    select image.storage_path
    from public.product_images as image
    where image.product_id = p.id
    order by image.sort_order, image.created_at, image.id
    limit 1
  ) as image_path,
  coalesce(
    array_agg(distinct v.size) filter (where v.is_active and v.size is not null),
    '{}'::text[]
  ) as sizes,
  coalesce(
    array_agg(distinct v.color_name) filter (where v.is_active and v.color_name is not null),
    '{}'::text[]
  ) as colors
from public.products as p
join public.categories as c on c.id = p.category_id
left join public.product_variants as v on v.product_id = p.id and v.is_active
group by p.id, c.slug;

grant select on public.product_listing to anon, authenticated;
