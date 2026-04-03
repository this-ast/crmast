-- Add first_contact date field to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_contact date;
