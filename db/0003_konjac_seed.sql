-- Seed konjac (ဝဥ / elephant foot yam) into the crop catalogue.
-- Harvest window: Oct–Jan (tuber lift). Adjust harvest_months if your reps disagree.
insert into public.crops (name_en, name_my, unit, harvest_months, category)
values ('Konjac', 'ဝဥ', 'kg', ARRAY[10,11,12,1], 'tuber')
on conflict do nothing;
