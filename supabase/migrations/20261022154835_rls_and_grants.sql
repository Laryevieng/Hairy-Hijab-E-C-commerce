-- Aktifkan RLS di SEMUA tabel
alter table public.store_settings       enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.shipping_rates       enable row level security;
alter table public.profiles             enable row level security;
alter table public.addresses            enable row level security;
alter table public.staff_roles          enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments             enable row level security;
alter table public.shipments            enable row level security;
alter table public.stock_movements      enable row level security;

-- ===== GRANT eksplisit =====
grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories, public.products, public.product_variants, public.product_images,
                public.shipping_rates, public.store_settings to anon, authenticated;

grant insert, update, delete on public.categories, public.products, public.product_images,
                                public.shipping_rates to authenticated;                 -- dibatasi RLS is_admin()
grant insert, delete on public.product_variants to authenticated;
grant update (sku, size, color_name, color_hex, color_hex_2, price, compare_at_price, is_active)
  on public.product_variants to authenticated;                                          -- TANPA stock_quantity
grant update on public.store_settings to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.staff_roles, public.orders, public.order_items, public.order_status_history,
                public.payments, public.shipments, public.stock_movements to authenticated;

grant all on all tables in schema public to service_role;

-- ===== Policy =====
-- Katalog publik
create policy categories_read on public.categories for select to anon, authenticated
  using (is_active or public.is_staff());
create policy categories_write on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select to anon, authenticated
  using (public.is_staff() or (is_active and exists (
    select 1 from public.categories c where c.id = products.category_id and c.is_active)));
create policy products_write on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy variants_read on public.product_variants for select to anon, authenticated
  using (public.is_staff() or (is_active and exists (
    select 1 from public.products p join public.categories c on c.id = p.category_id
     where p.id = product_variants.product_id and p.is_active and c.is_active)));
create policy variants_write on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy images_read on public.product_images for select to anon, authenticated
  using (public.is_staff() or exists (
    select 1 from public.products p join public.categories c on c.id = p.category_id
     where p.id = product_images.product_id and p.is_active and c.is_active));
create policy images_write on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy shipping_rates_read on public.shipping_rates for select to anon, authenticated
  using (is_active or public.is_staff());
create policy shipping_rates_write on public.shipping_rates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy store_settings_read on public.store_settings for select to anon, authenticated using (true);
create policy store_settings_update on public.store_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Identitas
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy addresses_own on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy staff_roles_read_own on public.staff_roles for select to authenticated
  using (user_id = (select auth.uid()));

-- Transaksi (baca saja)
create policy orders_read on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy order_items_read on public.order_items for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = order_items.order_id and o.user_id = (select auth.uid())));
create policy order_history_read on public.order_status_history for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = order_status_history.order_id and o.user_id = (select auth.uid())));
create policy payments_read on public.payments for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = payments.order_id and o.user_id = (select auth.uid())));
create policy shipments_read on public.shipments for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = shipments.order_id and o.user_id = (select auth.uid())));
create policy stock_movements_read on public.stock_movements for select to authenticated
  using (public.is_staff());

-- ===== Hak eksekusi fungsi =====
-- PUBLIC mendapat EXECUTE secara bawaan PostgreSQL; hanya bentuk tanpa "in schema" yang bisa mencabutnya.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_staff(), public.is_admin() to anon, authenticated, service_role;

grant execute on function
  public.cancel_order(uuid, text),
  public.verify_payment(uuid),
  public.adjust_stock(uuid, integer, text),
  public.reject_payment(uuid, text),
  public.mark_order_shipped(uuid, text, text, text),
  public.complete_order(uuid),
  public.mark_refunded(uuid, text)
  to authenticated;

grant execute on function
  public.create_order(uuid, uuid, text, text, text, jsonb, jsonb, text),
  public.submit_payment_proof(uuid, text, text, text, text),
  public.expire_unpaid_orders()
  to service_role;                     -- create_order TIDAK boleh dipanggil dari browser

-- ===== Audit RLS (dipakai tes P2-12) =====
create or replace function public.audit_tables_without_rls() returns setof text
language sql stable security definer set search_path = public as $$
  select c.relname::text
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r', 'p')
     and not c.relrowsecurity
   order by 1;
$$;

revoke execute on function public.audit_tables_without_rls() from public, anon, authenticated;
grant execute on function public.audit_tables_without_rls() to service_role;
