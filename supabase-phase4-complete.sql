-- ZAIN SUPER MART - Phase 4: Complete Business System
-- ===================================================
-- SAFE: IF NOT EXISTS, no destructive operations
-- New tables: customers, suppliers, purchases, purchase_items, expenses

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================
-- CUSTOMER TRANSACTIONS (credit/payments)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'payment')),
  amount DECIMAL(12,2) NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cust_tx_customer ON customer_transactions(customer_id);

-- ============================================
-- SUPPLIERS
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- ============================================
-- PURCHASES
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number VARCHAR(30) NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(created_at DESC);

-- ============================================
-- PURCHASE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================
-- Add customer_id to sales if not exists
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_id') THEN
    ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- RLS: Enable + anon policies for all new tables
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Customers
DROP POLICY IF EXISTS "anon_all_customers" ON customers;
CREATE POLICY "anon_all_customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_customers" ON customers;
CREATE POLICY "auth_all_customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customer Transactions
DROP POLICY IF EXISTS "anon_all_cust_tx" ON customer_transactions;
CREATE POLICY "anon_all_cust_tx" ON customer_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_cust_tx" ON customer_transactions;
CREATE POLICY "auth_all_cust_tx" ON customer_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Suppliers
DROP POLICY IF EXISTS "anon_all_suppliers" ON suppliers;
CREATE POLICY "anon_all_suppliers" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_suppliers" ON suppliers;
CREATE POLICY "auth_all_suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchases
DROP POLICY IF EXISTS "anon_all_purchases" ON purchases;
CREATE POLICY "anon_all_purchases" ON purchases FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_purchases" ON purchases;
CREATE POLICY "auth_all_purchases" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Items
DROP POLICY IF EXISTS "anon_all_purchase_items" ON purchase_items;
CREATE POLICY "anon_all_purchase_items" ON purchase_items FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_purchase_items" ON purchase_items;
CREATE POLICY "auth_all_purchase_items" ON purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expenses
DROP POLICY IF EXISTS "anon_all_expenses" ON expenses;
CREATE POLICY "anon_all_expenses" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_expenses" ON expenses;
CREATE POLICY "auth_all_expenses" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
