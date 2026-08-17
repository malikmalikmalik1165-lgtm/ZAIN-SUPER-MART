-- ZAIN SUPER MART — Add market_price to products
-- SAFE: Adds column if not exists, no data loss

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='market_price') THEN
    ALTER TABLE products ADD COLUMN market_price DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Fix sales payment_method CHECK constraint for all payment methods
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check
  CHECK (payment_method IN ('cash', 'credit', 'card', 'easypaisa', 'jazzcash', 'bank', 'other'));

NOTIFY pgrst, 'reload schema';
