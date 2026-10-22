create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'expire-unpaid-orders',
  '*/15 * * * *',
  $$select public.expire_unpaid_orders();$$
);
