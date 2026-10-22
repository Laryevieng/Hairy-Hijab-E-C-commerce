-- Trigger riwayat pesanan dan stok awal
create or replace function public.log_order_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, to_status, to_payment_status, actor_id)
    values (new.id, new.status, new.payment_status, (select auth.uid()));
  elsif new.status is distinct from old.status
     or new.payment_status is distinct from old.payment_status then
    insert into public.order_status_history
      (order_id, from_status, to_status, from_payment_status, to_payment_status, actor_id)
    values (new.id, old.status, new.status, old.payment_status, new.payment_status, (select auth.uid()));
  end if;
  return new;
end $$;

create trigger trg_orders_history after insert or update on public.orders
  for each row execute function public.log_order_change();

create or replace function public.log_initial_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.stock_quantity > 0 then
    insert into public.stock_movements (variant_id, movement_type, quantity_delta, stock_after, reason, actor_id)
    values (new.id, 'initial', new.stock_quantity, new.stock_quantity, 'Stok awal', (select auth.uid()));
  end if;
  return new;
end $$;

create trigger trg_variants_initial_stock after insert on public.product_variants
  for each row execute function public.log_initial_stock();

-- create_order: dipanggil hanya oleh server dengan admin client (service role)
create or replace function public.create_order(
  p_idempotency_key uuid,
  p_user_id uuid,                 -- diisi server dari sesi; null untuk tamu
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address jsonb,       -- {recipient_name, phone, province, city, district, postal_code, address_detail}
  p_items jsonb,                  -- [{"variant_id":"<uuid>","quantity":2}, ...]
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_expiry_hours integer;
  v_province text;
  v_shipping integer;
  v_subtotal integer := 0;
  v_item record;
  v_variant record;
begin
  -- 1. Idempotensi: kunci yang sama -> pesanan yang sama
  select * into v_order from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number,
                              'public_token', v_order.public_token, 'replayed', true);
  end if;

  -- 2. Validasi bentuk input
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'INVALID_ITEM';
  end if;

  v_province := nullif(trim(p_shipping_address->>'province'), '');
  if v_province is null
     or nullif(trim(p_shipping_address->>'recipient_name'), '') is null
     or nullif(trim(p_shipping_address->>'phone'), '') is null
     or nullif(trim(p_shipping_address->>'city'), '') is null
     or nullif(trim(p_shipping_address->>'address_detail'), '') is null then
    raise exception 'INVALID_ADDRESS';
  end if;

  -- 3. Ongkir: provinsi yang cocok lebih dulu, lalu baris default '*'
  select cost into v_shipping
    from public.shipping_rates
   where is_active and (lower(province) = lower(v_province) or province = '*')
   order by (province = '*') asc
   limit 1;
  if v_shipping is null then
    raise exception 'SHIPPING_UNAVAILABLE';
  end if;

  select payment_expiry_hours into v_expiry_hours from public.store_settings where id = 1;
  v_expiry_hours := coalesce(v_expiry_hours, 24);

  -- 4. Nomor pesanan HH-YYMMDD-XXXXX (waktu Jakarta)
  loop
    v_order_number := 'HH-' || to_char(timezone('Asia/Jakarta', now()), 'YYMMDD') || '-' || public.random_code(5);
    exit when not exists (select 1 from public.orders where order_number = v_order_number);
  end loop;

  insert into public.orders (order_number, idempotency_key, user_id, customer_name_snapshot,
      customer_phone_snapshot, customer_email_snapshot, shipping_address_snapshot, notes, expires_at)
  values (v_order_number, p_idempotency_key, p_user_id, p_customer_name, p_customer_phone,
      nullif(p_customer_email, ''), p_shipping_address, p_notes,
      now() + make_interval(hours => v_expiry_hours))
  returning id into v_order_id;

  -- 5. Gabungkan baris duplikat; kunci varian berurutan (cegah deadlock)
  for v_item in
    select (e->>'variant_id')::uuid as variant_id, sum((e->>'quantity')::int) as quantity
      from jsonb_array_elements(p_items) e
     group by 1
     order by 1
  loop
    if v_item.quantity < 1 or v_item.quantity > 20 then
      raise exception 'INVALID_ITEM';
    end if;

    select v.id, v.sku, v.size, v.color_name, v.price, v.stock_quantity,
           v.is_active as v_active, p.name as product_name,
           p.is_active as p_active, c.is_active as c_active
      into v_variant
      from public.product_variants v
      join public.products p   on p.id = v.product_id
      join public.categories c on c.id = p.category_id
     where v.id = v_item.variant_id
       for update of v;

    if not found or not v_variant.v_active or not v_variant.p_active or not v_variant.c_active then
      raise exception 'VARIANT_UNAVAILABLE:%', v_item.variant_id;
    end if;
    if v_variant.stock_quantity < v_item.quantity then
      raise exception 'INSUFFICIENT_STOCK:%', v_item.variant_id;
    end if;

    update public.product_variants
       set stock_quantity = stock_quantity - v_item.quantity
     where id = v_item.variant_id;

    insert into public.stock_movements
      (variant_id, movement_type, quantity_delta, stock_after, order_id, reason)
    values (v_item.variant_id, 'reserve', -v_item.quantity,
            v_variant.stock_quantity - v_item.quantity, v_order_id, 'Reservasi checkout');

    insert into public.order_items
      (order_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot,
       color_snapshot, unit_price, quantity, line_total)
    values (v_order_id, v_item.variant_id, v_variant.product_name, v_variant.sku, v_variant.size,
            v_variant.color_name, v_variant.price, v_item.quantity, v_variant.price * v_item.quantity);

    v_subtotal := v_subtotal + v_variant.price * v_item.quantity;
  end loop;

  update public.orders
     set subtotal = v_subtotal, shipping_cost = v_shipping, grand_total = v_subtotal + v_shipping
   where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number,
    'public_token', (select public_token from public.orders where id = v_order_id),
    'replayed', false);
end $$;

-- Pelepasan stok
create or replace function public.release_order_stock(p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_item record;
  v_new_stock integer;
begin
  if exists (select 1 from public.orders where id = p_order_id and stock_released_at is not null) then
    return;                                                    -- sudah pernah dilepas
  end if;
  for v_item in
    select variant_id, quantity from public.order_items
     where order_id = p_order_id and variant_id is not null
     order by variant_id
  loop
    update public.product_variants set stock_quantity = stock_quantity + v_item.quantity
     where id = v_item.variant_id returning stock_quantity into v_new_stock;
    if found then
      insert into public.stock_movements
        (variant_id, movement_type, quantity_delta, stock_after, order_id, reason, actor_id)
      values (v_item.variant_id, 'release', v_item.quantity, v_new_stock, p_order_id, p_reason, (select auth.uid()));
    end if;
  end loop;
  update public.orders set stock_released_at = now() where id = p_order_id;
end $$;

-- Pembatalan pesanan
create or replace function public.cancel_order(p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status not in ('pending','processing') then raise exception 'INVALID_TRANSITION'; end if;
  perform public.release_order_stock(p_order_id, coalesce(nullif(trim(p_reason), ''), 'Pesanan dibatalkan'));
  update public.orders set status = 'cancelled', cancel_reason = nullif(trim(p_reason), '')
   where id = p_order_id;
end $$;

-- Kedaluwarsa pesanan yang belum dibayar
create or replace function public.expire_unpaid_orders() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_count integer := 0;
begin
  for v_order in
    select id from public.orders
     where status = 'pending' and payment_status = 'unpaid' and expires_at < now()
     order by expires_at
       for update skip locked
  loop
    perform public.release_order_stock(v_order.id, 'Pesanan kedaluwarsa');
    update public.orders set status = 'expired' where id = v_order.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- Pengunggahan bukti pembayaran
create or replace function public.submit_payment_proof(
  p_order_id uuid, p_proof_path text, p_bank_name text, p_sender_name text, p_note text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'pending' or v_order.payment_status <> 'unpaid' or v_order.expires_at < now() then
    raise exception 'INVALID_TRANSITION';
  end if;
  insert into public.payments (order_id, amount, status, proof_path, bank_name, sender_name, customer_note, submitted_at)
  values (p_order_id, v_order.grand_total, 'submitted', p_proof_path,
          nullif(trim(p_bank_name), ''), nullif(trim(p_sender_name), ''), nullif(trim(p_note), ''), now());
  update public.orders set payment_status = 'proof_submitted' where id = p_order_id;
end $$;

-- Verifikasi pembayaran oleh staf
create or replace function public.verify_payment(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'pending' or v_order.payment_status <> 'proof_submitted' then
    raise exception 'INVALID_TRANSITION';
  end if;
  update public.payments
     set status = 'verified', reviewed_at = now(), reviewed_by = (select auth.uid())
   where id = (select id from public.payments
                where order_id = p_order_id and status = 'submitted'
                order by submitted_at desc limit 1);
  update public.orders set payment_status = 'paid', status = 'processing', paid_at = now()
   where id = p_order_id;
end $$;

-- Penyesuaian stok oleh staf
create or replace function public.adjust_stock(p_variant_id uuid, p_delta integer, p_reason text)
returns integer
language plpgsql security definer set search_path = public as $$
declare v_new integer;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_delta = 0 or nullif(trim(p_reason), '') is null then raise exception 'INVALID_ITEM'; end if;
  update public.product_variants set stock_quantity = stock_quantity + p_delta
   where id = p_variant_id returning stock_quantity into v_new;      -- stok negatif ditolak CHECK (23514)
  if not found then raise exception 'VARIANT_UNAVAILABLE'; end if;
  insert into public.stock_movements (variant_id, movement_type, quantity_delta, stock_after, reason, actor_id)
  values (p_variant_id, case when p_delta > 0 then 'restock' else 'adjustment' end::public.stock_movement_type,
          p_delta, v_new, trim(p_reason), (select auth.uid()));
  return v_new;
end $$;

-- Penolakan bukti pembayaran oleh staf (§11.6)
create or replace function public.reject_payment(p_order_id uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_expiry_hours integer;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'pending' or v_order.payment_status <> 'proof_submitted' then
    raise exception 'INVALID_TRANSITION';
  end if;
  if nullif(trim(p_note), '') is null then
    raise exception 'INVALID_TRANSITION';
  end if;

  select payment_expiry_hours into v_expiry_hours from public.store_settings where id = 1;
  v_expiry_hours := coalesce(v_expiry_hours, 24);

  update public.payments
     set status = 'rejected',
         review_note = trim(p_note),
         reviewed_by = (select auth.uid()),
         reviewed_at = now()
   where id = (select id from public.payments
                where order_id = p_order_id and status = 'submitted'
                order by submitted_at desc limit 1);

  update public.orders
     set payment_status = 'unpaid',
         expires_at = now() + make_interval(hours => v_expiry_hours)
   where id = p_order_id;
end $$;

-- Pengiriman pesanan oleh staf (§11.6)
create or replace function public.mark_order_shipped(
  p_order_id uuid,
  p_courier text,
  p_service text default null,
  p_tracking_number text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'processing' then
    raise exception 'INVALID_TRANSITION';
  end if;
  if nullif(trim(p_courier), '') is null then
    raise exception 'INVALID_TRANSITION';
  end if;

  insert into public.shipments (order_id, courier, service, tracking_number, status, shipped_at)
  values (p_order_id, trim(p_courier), nullif(trim(p_service), ''), nullif(trim(p_tracking_number), ''), 'shipped', now())
  on conflict (order_id) do update
    set courier = excluded.courier,
        service = excluded.service,
        tracking_number = excluded.tracking_number,
        status = 'shipped',
        shipped_at = now();

  update public.orders
     set status = 'shipped',
         shipped_at = now()
   where id = p_order_id;
end $$;

-- Penyelesaian pesanan oleh staf (§11.6)
create or replace function public.complete_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'shipped' then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.orders
     set status = 'completed'
   where id = p_order_id;

  update public.shipments
     set status = 'delivered',
         delivered_at = now()
   where order_id = p_order_id;
end $$;

-- Pengembalian dana pesanan batal oleh staf (§11.6)
create or replace function public.mark_refunded(p_order_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'cancelled' or v_order.payment_status <> 'paid' then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.orders
     set payment_status = 'refunded'
   where id = p_order_id;

  if nullif(trim(p_note), '') is not null then
    update public.payments
       set review_note = case
             when review_note is null or review_note = '' then trim(p_note)
             else review_note || E'\n' || trim(p_note)
           end
     where id = (select id from public.payments
                  where order_id = p_order_id and status = 'verified'
                  order by reviewed_at desc nulls last, submitted_at desc limit 1);
  end if;
end $$;
