-- =====================================================
-- CRM Недвижимость — начальная схема базы данных
-- =====================================================

-- Перечисления
CREATE TYPE user_role AS ENUM ('admin', 'agency_owner', 'agency_manager', 'realtor', 'viewer');
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'commercial', 'land');
CREATE TYPE property_status AS ENUM ('draft', 'active', 'reserved', 'sold', 'rented', 'archived');
CREATE TYPE client_type AS ENUM ('buyer', 'seller', 'tenant', 'landlord');
CREATE TYPE client_status AS ENUM ('new', 'contacted', 'negotiation', 'deal', 'lost');
CREATE TYPE deal_type AS ENUM ('sale', 'rent');
CREATE TYPE deal_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE interaction_type AS ENUM ('call', 'meeting', 'email', 'message', 'viewing', 'note');
CREATE TYPE document_status AS ENUM ('draft', 'sent', 'signed', 'cancelled');

-- =====================================================
-- Агентства
-- =====================================================
CREATE TABLE agencies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  logo_url    text,
  phone       text,
  email       text,
  address     text,
  city        text,
  settings    jsonb DEFAULT '{}'::jsonb,
  plan        text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- =====================================================
-- Профили пользователей (привязаны к auth.users)
-- =====================================================
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id       uuid REFERENCES agencies(id) ON DELETE SET NULL,
  role            user_role DEFAULT 'realtor',
  full_name       text NOT NULL DEFAULT '',
  avatar_url      text,
  phone           text,
  email           text NOT NULL,
  specialization  text,
  is_active       boolean DEFAULT true,
  settings        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_agency ON profiles(agency_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =====================================================
-- Объекты недвижимости
-- =====================================================
CREATE TABLE properties (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  realtor_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type          property_type NOT NULL,
  status        property_status DEFAULT 'draft',
  title         text NOT NULL,
  description   text,
  address       text NOT NULL,
  city          text NOT NULL,
  district      text,
  lat           double precision,
  lng           double precision,
  price         numeric(15,2) NOT NULL,
  currency      text DEFAULT 'RUB',
  area          numeric(10,2),
  rooms         integer,
  floor         integer,
  total_floors  integer,
  features      jsonb DEFAULT '{}'::jsonb,
  published_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_properties_agency ON properties(agency_id);
CREATE INDEX idx_properties_realtor ON properties(realtor_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);

-- =====================================================
-- Фотографии объектов
-- =====================================================
CREATE TABLE property_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url           text NOT NULL,
  sort_order    integer DEFAULT 0,
  is_cover      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_property_images_property ON property_images(property_id);

-- =====================================================
-- История цен объектов
-- =====================================================
CREATE TABLE property_price_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  old_price     numeric(15,2) NOT NULL,
  new_price     numeric(15,2) NOT NULL,
  changed_at    timestamptz DEFAULT now(),
  changed_by    uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_price_history_property ON property_price_history(property_id);

-- =====================================================
-- Клиенты
-- =====================================================
CREATE TABLE clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  realtor_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  full_name     text NOT NULL,
  phone         text,
  email         text,
  type          client_type NOT NULL,
  status        client_status DEFAULT 'new',
  preferences   jsonb DEFAULT '{}'::jsonb,
  source        text,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_clients_agency ON clients(agency_id);
CREATE INDEX idx_clients_realtor ON clients(realtor_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_type ON clients(type);

-- =====================================================
-- История взаимодействий с клиентами
-- =====================================================
CREATE TABLE client_interactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  realtor_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type          interaction_type NOT NULL,
  description   text NOT NULL,
  occurred_at   timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_interactions_client ON client_interactions(client_id);
CREATE INDEX idx_interactions_realtor ON client_interactions(realtor_id);

-- =====================================================
-- Сделки
-- =====================================================
CREATE TABLE deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id           uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  realtor_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  property_id         uuid REFERENCES properties(id) ON DELETE SET NULL,
  client_id           uuid REFERENCES clients(id) ON DELETE SET NULL,
  type                deal_type NOT NULL,
  status              deal_status DEFAULT 'active',
  stage               text DEFAULT 'Новая',
  price               numeric(15,2) NOT NULL,
  commission_percent  numeric(5,2),
  commission_amount   numeric(15,2),
  notes               text,
  created_at          timestamptz DEFAULT now(),
  closed_at           timestamptz,
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_deals_agency ON deals(agency_id);
CREATE INDEX idx_deals_realtor ON deals(realtor_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_property ON deals(property_id);
CREATE INDEX idx_deals_client ON deals(client_id);

-- =====================================================
-- Этапы сделки
-- =====================================================
CREATE TABLE deal_stages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id       uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  stage_name    text NOT NULL,
  completed     boolean DEFAULT false,
  completed_at  timestamptz,
  sort_order    integer DEFAULT 0
);

CREATE INDEX idx_deal_stages_deal ON deal_stages(deal_id);

-- =====================================================
-- Документы
-- =====================================================
CREATE TABLE documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  deal_id       uuid REFERENCES deals(id) ON DELETE SET NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  name          text NOT NULL,
  file_url      text,
  type          text NOT NULL,
  status        document_status DEFAULT 'draft',
  version       integer DEFAULT 1,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_documents_agency ON documents(agency_id);
CREATE INDEX idx_documents_deal ON documents(deal_id);

-- =====================================================
-- Уведомления
-- =====================================================
CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  message       text NOT NULL,
  type          text DEFAULT 'info',
  is_read       boolean DEFAULT false,
  link          text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =====================================================
-- Лог действий
-- =====================================================
CREATE TABLE activity_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agency_id     uuid REFERENCES agencies(id) ON DELETE SET NULL,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid,
  details       jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_agency ON activity_log(agency_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- =====================================================
-- Функция: обновление updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agencies_updated BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Триггер: запись изменения цены объекта
-- =====================================================
CREATE OR REPLACE FUNCTION track_property_price_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO property_price_history (property_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_property_price_change BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION track_property_price_change();

-- =====================================================
-- Триггер: уведомление при смене статуса сделки
-- =====================================================
CREATE OR REPLACE FUNCTION notify_deal_status_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.realtor_id,
      'Статус сделки изменён',
      'Сделка переведена в статус: ' || NEW.status::text,
      'deal_status',
      '/deals/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deal_status_change AFTER UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION notify_deal_status_change();

-- =====================================================
-- Функция: автоматическое создание профиля при регистрации
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'realtor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Функция: автоматический расчёт комиссии
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_deal_commission()
RETURNS trigger AS $$
BEGIN
  IF NEW.commission_percent IS NOT NULL AND NEW.price IS NOT NULL THEN
    NEW.commission_amount = ROUND(NEW.price * NEW.commission_percent / 100, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_commission BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION calculate_deal_commission();

-- =====================================================
-- Вспомогательная функция: получение agency_id текущего пользователя
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS uuid AS $$
  SELECT agency_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Агентства: пользователь видит своё агентство
CREATE POLICY agencies_select ON agencies FOR SELECT
  USING (id = get_user_agency_id() OR get_user_role() = 'admin');

CREATE POLICY agencies_update ON agencies FOR UPDATE
  USING (id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'admin'));

CREATE POLICY agencies_insert ON agencies FOR INSERT
  WITH CHECK (get_user_role() = 'admin' OR true);

-- Профили: коллеги по агентству
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (
    agency_id = get_user_agency_id()
    OR id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'admin'))
  );

CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (true);

-- Объекты: риэлтор свои, менеджер — все в агентстве
CREATE POLICY properties_select ON properties FOR SELECT
  USING (
    agency_id = get_user_agency_id()
    OR get_user_role() = 'admin'
  );

CREATE POLICY properties_insert ON properties FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY properties_update ON properties FOR UPDATE
  USING (
    (realtor_id = auth.uid() AND agency_id = get_user_agency_id())
    OR (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

CREATE POLICY properties_delete ON properties FOR DELETE
  USING (
    (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

-- Фото объектов: наследуют доступ от объектов
CREATE POLICY property_images_select ON property_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = property_images.property_id
  ));

CREATE POLICY property_images_insert ON property_images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
      AND (properties.realtor_id = auth.uid()
           OR get_user_role() IN ('agency_owner', 'agency_manager', 'admin'))
  ));

CREATE POLICY property_images_delete ON property_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
      AND (properties.realtor_id = auth.uid()
           OR get_user_role() IN ('agency_owner', 'agency_manager', 'admin'))
  ));

-- История цен: только чтение
CREATE POLICY price_history_select ON property_price_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = property_price_history.property_id
  ));

CREATE POLICY price_history_insert ON property_price_history FOR INSERT
  WITH CHECK (true);

-- Клиенты
CREATE POLICY clients_select ON clients FOR SELECT
  USING (
    (realtor_id = auth.uid())
    OR (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

CREATE POLICY clients_insert ON clients FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY clients_update ON clients FOR UPDATE
  USING (
    (realtor_id = auth.uid() AND agency_id = get_user_agency_id())
    OR (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

CREATE POLICY clients_delete ON clients FOR DELETE
  USING (
    (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

-- Взаимодействия с клиентами
CREATE POLICY interactions_select ON client_interactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = client_interactions.client_id
  ));

CREATE POLICY interactions_insert ON client_interactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_interactions.client_id
      AND clients.agency_id = get_user_agency_id()
  ));

-- Сделки
CREATE POLICY deals_select ON deals FOR SELECT
  USING (
    (realtor_id = auth.uid())
    OR (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

CREATE POLICY deals_insert ON deals FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY deals_update ON deals FOR UPDATE
  USING (
    (realtor_id = auth.uid() AND agency_id = get_user_agency_id())
    OR (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

CREATE POLICY deals_delete ON deals FOR DELETE
  USING (
    (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner'))
    OR get_user_role() = 'admin'
  );

-- Этапы сделки
CREATE POLICY deal_stages_select ON deal_stages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deals WHERE deals.id = deal_stages.deal_id
  ));

CREATE POLICY deal_stages_insert ON deal_stages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_stages.deal_id AND deals.agency_id = get_user_agency_id()
  ));

CREATE POLICY deal_stages_update ON deal_stages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_stages.deal_id AND deals.agency_id = get_user_agency_id()
  ));

-- Документы
CREATE POLICY documents_select ON documents FOR SELECT
  USING (
    agency_id = get_user_agency_id()
    OR get_user_role() = 'admin'
  );

CREATE POLICY documents_insert ON documents FOR INSERT
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY documents_update ON documents FOR UPDATE
  USING (
    agency_id = get_user_agency_id()
    OR get_user_role() = 'admin'
  );

CREATE POLICY documents_delete ON documents FOR DELETE
  USING (
    (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

-- Уведомления: только свои
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY notifications_delete ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Лог действий
CREATE POLICY activity_log_select ON activity_log FOR SELECT
  USING (
    user_id = auth.uid()
    OR (agency_id = get_user_agency_id() AND get_user_role() IN ('agency_owner', 'agency_manager'))
    OR get_user_role() = 'admin'
  );

CREATE POLICY activity_log_insert ON activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Защита от удаления объектов с активными сделками
-- =====================================================
CREATE OR REPLACE FUNCTION prevent_property_delete_with_deals()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM deals WHERE property_id = OLD.id AND status = 'active') THEN
    RAISE EXCEPTION 'Невозможно удалить объект с активными сделками';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_property_delete
  BEFORE DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION prevent_property_delete_with_deals();

-- =====================================================
-- Storage бакеты
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('property-images', 'property-images', true),
  ('documents', 'documents', false),
  ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;
