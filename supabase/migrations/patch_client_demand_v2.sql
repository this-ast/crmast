-- v2: seller_status on clients, renovation on demands

-- Seller/Landlord active status (separate from buyer temperature status)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS seller_status text DEFAULT 'Активный';

-- Renovation preferences on demand
ALTER TABLE demands ADD COLUMN IF NOT EXISTS renovation text[] DEFAULT '{}';
