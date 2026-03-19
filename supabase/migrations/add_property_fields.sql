-- Добавить поля: тип рынка, тип сделки, условия ипотеки/рассрочки
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS market_type TEXT CHECK (market_type IN ('secondary', 'new_build')),
  ADD COLUMN IF NOT EXISTS deal_type TEXT NOT NULL DEFAULT 'sale' CHECK (deal_type IN ('sale', 'rent')),
  ADD COLUMN IF NOT EXISTS has_mortgage BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_installment BOOLEAN NOT NULL DEFAULT false;

-- Индексы для фильтрации
CREATE INDEX IF NOT EXISTS idx_properties_market_type ON properties (market_type);
CREATE INDEX IF NOT EXISTS idx_properties_deal_type ON properties (deal_type);
