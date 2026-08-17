// Phase 1: Foundation types
// Future entity types will be added in later phases

export type UserRole = "admin" | "cashier" | "stock_manager";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

// Future entity type placeholders (not implemented yet)
// These type definitions are reserved for future phases:
// - Product
// - Category
// - InventoryItem
// - Sale / SaleItem
// - Purchase / PurchaseItem
// - Customer / CustomerTransaction
// - Supplier / SupplierTransaction
// - Expense
// - Payment
// - StockMovement
// - AuditLog
