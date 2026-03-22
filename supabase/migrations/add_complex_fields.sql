-- Новые поля ЖК: этажность, лифт, двор, парковка, тип дома
ALTER TABLE complexes
  ADD COLUMN IF NOT EXISTS floors_total text,
  ADD COLUMN IF NOT EXISTS elevator     text,
  ADD COLUMN IF NOT EXISTS yard_features text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parking      text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS building_type text;

NOTIFY pgrst, 'reload schema';
