-- ZAIN SUPER MART - Phase 2 Database Schema
-- Run this SQL in Supabase Dashboard > SQL Editor
-- =============================================
-- SAFE TO RUN MULTIPLE TIMES (uses IF NOT EXISTS)
-- After running, wait 1-2 minutes for schema cache refresh
-- Or click "Reload schema" in Settings > API

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for active category names (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_unique 
  ON categories(LOWER(name)) WHERE is_active = true;

-- Index for filtering by active status
CREATE INDEX IF NOT EXISTS idx_categories_active 
  ON categories(is_active);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'piece',
  purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique barcode constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique 
  ON products(barcode) WHERE barcode IS NOT NULL AND barcode != '';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active 
  ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name 
  ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_stock 
  ON products(stock_quantity);

-- ============================================
-- INVENTORY MOVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for product movement history
CREATE INDEX IF NOT EXISTS idx_movements_product 
  ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created 
  ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type 
  ON inventory_movements(movement_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Allow authenticated read categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated insert categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated update categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated delete categories" ON categories;

DROP POLICY IF EXISTS "Allow authenticated read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON products;

DROP POLICY IF EXISTS "Allow authenticated read movements" ON inventory_movements;
DROP POLICY IF EXISTS "Allow authenticated insert movements" ON inventory_movements;

-- Categories policies
CREATE POLICY "Allow authenticated read categories" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert categories" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update categories" ON categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete categories" ON categories
  FOR DELETE TO authenticated USING (true);

-- Products policies
CREATE POLICY "Allow authenticated read products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert products" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update products" ON products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete products" ON products
  FOR DELETE TO authenticated USING (true);

-- Inventory movements policies
CREATE POLICY "Allow authenticated read movements" ON inventory_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert movements" ON inventory_movements
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTIFY POSTGREST TO REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION QUERY (should return table info)
-- ============================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'products', 'inventory_movements');
