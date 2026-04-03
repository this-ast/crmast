-- Client enhancements: multi-type, seller/landlord fields, global active status

-- Multi-type support (array of roles)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_types text[] DEFAULT '{}';

-- Populate client_types from existing client_type for backward compat
UPDATE clients
  SET client_types = ARRAY[client_type]
  WHERE client_type IS NOT NULL
    AND (client_types IS NULL OR client_types = '{}' OR array_length(client_types, 1) IS NULL);

-- Seller: net price (цена на руки)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS price_net numeric;

-- Landlord: rental fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rental_price    numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rental_deposit  numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rental_utilities text; -- 'included' | 'separate'

-- Global active/inactive flag (for buyers/tenants in addition to temperature status)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
