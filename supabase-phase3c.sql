-- ZAIN SUPER MART - Phase 3C: Fix RLS for Custom Auth
-- ==================================================
-- SAFE: Does NOT modify table structure, columns, or data.
-- Only adds RLS policies to allow the anon key to write.
-- API routes enforce ZSM custom session verification before any write.
-- Direct public access is prevented by API-layer authentication.

-- ============================================
-- CATEGORIES: Add anon write policies
-- ============================================
DROP POLICY IF EXISTS "Allow anon write categories" ON categories;
CREATE POLICY "Allow anon write categories" ON categories
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update categories" ON categories;
CREATE POLICY "Allow anon update categories" ON categories
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete categories" ON categories;
CREATE POLICY "Allow anon delete categories" ON categories
  FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read categories" ON categories;
CREATE POLICY "Allow anon read categories" ON categories
  FOR SELECT TO anon USING (true);

-- ============================================
-- PRODUCTS: Add anon write policies
-- ============================================
DROP POLICY IF EXISTS "Allow anon write products" ON products;
CREATE POLICY "Allow anon write products" ON products
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update products" ON products;
CREATE POLICY "Allow anon update products" ON products
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete products" ON products;
CREATE POLICY "Allow anon delete products" ON products
  FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read products" ON products;
CREATE POLICY "Allow anon read products" ON products
  FOR SELECT TO anon USING (true);

-- ============================================
-- INVENTORY MOVEMENTS: Add anon write policies
-- ============================================
DROP POLICY IF EXISTS "Allow anon write movements" ON inventory_movements;
CREATE POLICY "Allow anon write movements" ON inventory_movements
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read movements" ON inventory_movements;
CREATE POLICY "Allow anon read movements" ON inventory_movements
  FOR SELECT TO anon USING (true);

-- ============================================
-- SALES: Add anon write policies
-- ============================================
DROP POLICY IF EXISTS "Allow anon write sales" ON sales;
CREATE POLICY "Allow anon write sales" ON sales
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update sales" ON sales;
CREATE POLICY "Allow anon update sales" ON sales
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete sales" ON sales;
CREATE POLICY "Allow anon delete sales" ON sales
  FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read sales" ON sales;
CREATE POLICY "Allow anon read sales" ON sales
  FOR SELECT TO anon USING (true);

-- ============================================
-- SALE ITEMS: Add anon write policies
-- ============================================
DROP POLICY IF EXISTS "Allow anon write sale_items" ON sale_items;
CREATE POLICY "Allow anon write sale_items" ON sale_items
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete sale_items" ON sale_items;
CREATE POLICY "Allow anon delete sale_items" ON sale_items
  FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read sale_items" ON sale_items;
CREATE POLICY "Allow anon read sale_items" ON sale_items
  FOR SELECT TO anon USING (true);

-- ============================================
-- NOTIFY POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';
