-- ZAIN SUPER MART — Fix payment_method CHECK constraint
-- =====================================================
-- SAFE: Only drops and recreates the CHECK constraint.
-- Does NOT delete data, drop tables, or modify columns.
-- Existing sales records with 'cash', 'card', 'other' remain valid.

-- Drop the old constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Add the new constraint with all supported payment methods
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check
  CHECK (payment_method IN ('cash', 'credit', 'card', 'easypaisa', 'jazzcash', 'bank', 'other'));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'sales'::regclass AND contype = 'c';
