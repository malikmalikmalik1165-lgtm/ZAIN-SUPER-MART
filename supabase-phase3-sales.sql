-- ZAIN SUPER MART - Phase 3A: Sales Tables
-- Run this SQL in Supabase Dashboard > SQL Editor
-- =============================================
-- SAFE: Uses IF NOT EXISTS, no destructive operations
-- Does NOT modify existing tables (categories, products, inventory_movements)

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number VARCHAR(30) NOT NULL UNIQUE,
  customer_id UUID DEFAULT NULL, -- nullable until Customers module is built
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'other')),
  amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
  change_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at::date);

-- ============================================
-- SALE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL, -- denormalized for receipt history
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated insert sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated update sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated delete sales" ON sales;

DROP POLICY IF EXISTS "Allow authenticated read sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated delete sale_items" ON sale_items;

-- sales: SELECT, INSERT, UPDATE, DELETE for authenticated
CREATE POLICY "Allow authenticated read sales" ON sales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert sales" ON sales
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update sales" ON sales
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete sales" ON sales
  FOR DELETE TO authenticated USING (true);

-- sale_items: SELECT, INSERT, DELETE for authenticated
CREATE POLICY "Allow authenticated read sale_items" ON sale_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert sale_items" ON sale_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete sale_items" ON sale_items
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- NOTIFY POSTGREST TO REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sales', 'sale_items')
ORDER BY table_name;
