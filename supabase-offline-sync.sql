-- ZAIN SUPER MART — Offline sale idempotency
-- SAFE, ADDITIVE, NON-DESTRUCTIVE
-- Adds one nullable identifier to existing sales; existing rows remain unchanged.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name = 'offline_client_id'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN offline_client_id VARCHAR(100);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_offline_client_id_unique
  ON public.sales (offline_client_id)
  WHERE offline_client_id IS NOT NULL AND offline_client_id <> '';

CREATE INDEX IF NOT EXISTS idx_sales_offline_pending_lookup
  ON public.sales (offline_client_id, created_at DESC)
  WHERE offline_client_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';

-- Read-only verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sales'
  AND column_name = 'offline_client_id';
