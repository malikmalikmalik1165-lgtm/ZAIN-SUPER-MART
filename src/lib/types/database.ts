/**
 * ZAIN SUPER MART - Database Types
 * Phase 2: Products & Inventory
 */

// ============================================
// UNITS
// ============================================
export const PRODUCT_UNITS = [
  { value: "piece", label: "Piece" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "kg", label: "Kg" },
  { value: "gram", label: "Gram" },
  { value: "liter", label: "Liter" },
  { value: "ml", label: "Milliliter" },
  { value: "dozen", label: "Dozen" },
  { value: "bottle", label: "Bottle" },
  { value: "carton", label: "Carton" },
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number]["value"];

// ============================================
// MOVEMENT TYPES
// ============================================
export const MOVEMENT_TYPES = [
  { value: "STOCK_IN", label: "Stock In", color: "emerald" },
  { value: "STOCK_OUT", label: "Stock Out", color: "red" },
  { value: "ADJUSTMENT", label: "Adjustment", color: "blue" },
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number]["value"];

// ============================================
// CATEGORY
// ============================================
export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
}

// ============================================
// PRODUCT
// ============================================
export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  unit: ProductUnit;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  minimum_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category | null;
}

export interface ProductFormData {
  name: string;
  barcode: string;
  category_id: string;
  unit: ProductUnit;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  minimum_stock: number;
  is_active: boolean;
}

// ============================================
// INVENTORY MOVEMENT
// ============================================
export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  note: string | null;
  created_at: string;
  created_by: string | null;
  // Joined fields
  product?: Product | null;
}

export interface StockAdjustmentData {
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  note: string;
}

// ============================================
// STOCK STATUS
// ============================================
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getStockStatus(
  stockQuantity: number,
  minimumStock: number
): StockStatus {
  if (stockQuantity === 0) return "out_of_stock";
  if (stockQuantity <= minimumStock) return "low_stock";
  return "in_stock";
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "out_of_stock":
      return "Out of Stock";
    case "low_stock":
      return "Low Stock";
    case "in_stock":
      return "In Stock";
  }
}

export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case "out_of_stock":
      return "text-red-600 bg-red-50";
    case "low_stock":
      return "text-amber-600 bg-amber-50";
    case "in_stock":
      return "text-emerald-600 bg-emerald-50";
  }
}

// ============================================
// PAYMENT METHODS
// ============================================
export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

// ============================================
// SALE
// ============================================
export interface Sale {
  id: string;
  sale_number: string;
  customer_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  status: "completed" | "refunded" | "cancelled";
  notes: string | null;
  created_at: string;
  created_by: string | null;
  // Joined
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  barcode: string | null;
  unit: string;
  unit_price: number;
  stock_available: number;
  quantity: number;
  discount: number;
  line_total: number;
}

export interface SalePayload {
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    line_total: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  notes?: string;
}

// ============================================
// DASHBOARD STATS
// ============================================
export interface ProductInventoryStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  todaySales?: number;
  todayTransactions?: number;
}
