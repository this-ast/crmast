-- Add funnel_stage column to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT DEFAULT 'new';

-- Valid values: new | needs | selection | showings | thinking | bargain | deal

COMMENT ON COLUMN clients.funnel_stage IS 'Sales funnel stage: new, needs, selection, showings, thinking, bargain, deal';
