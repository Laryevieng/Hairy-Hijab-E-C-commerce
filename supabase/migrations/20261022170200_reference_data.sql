insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.categories (name, slug, requires_size, size_options, sort_order) values
  ('Bergo Non Karet',        'bergo-non-karet',        true,  '{S,M}', 1),
  ('Bergo Karet',            'bergo-karet',            true,  '{S,M}', 2),
  ('Pashmina Kaos Rayon',    'pashmina-kaos-rayon',    false, '{}',    3),
  ('Pashmina Viscose',       'pashmina-viscose',       false, '{}',    4),
  ('Pashmina Bandana',       'pashmina-bandana',       false, '{}',    5),
  ('Bergo Bandana',          'bergo-bandana',          true,  '{S,M}', 6),
  ('Bergo Bandana Two Tone', 'bergo-bandana-two-tone', true,  '{S,M}', 7),
  ('Paris Jadul',            'paris-jadul',            false, '{}',    8)
on conflict (slug) do nothing;

-- TODO(owner): ganti dengan tarif nyata sebelum peluncuran (§19, Q-03).
insert into public.shipping_rates (province, label, cost, estimated_days)
values ('*', 'Tarif flat', 20000, '2–5 hari kerja')
on conflict (province) do nothing;
