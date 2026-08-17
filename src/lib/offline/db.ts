/**
 * ZAIN SUPER MART — Offline Database (Dexie/IndexedDB)
 */
import Dexie, { type Table } from "dexie";

export interface OfflineProduct {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  unit: string;
  sale_price: number;
  purchase_price: number;
  stock_quantity: number;
  is_active: boolean;
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
}

export interface PendingSale {
  clientId: string;
  items: { product_id: string; product_name: string; quantity: number; unit_price: number; discount: number; line_total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  amount_paid: number;
  change_amount: number;
  customer_id: string | null;
  created_at: string;
  synced: boolean;
}

class ZsmOfflineDB extends Dexie {
  products!: Table<OfflineProduct, string>;
  customers!: Table<OfflineCustomer, string>;
  pendingSales!: Table<PendingSale, string>;

  constructor() {
    super("zsm_offline");
    this.version(1).stores({
      products: "id, barcode, name",
      customers: "id, name",
      pendingSales: "clientId, synced",
    });
  }
}

export const offlineDb = new ZsmOfflineDB();

// Cache products locally for offline use
export async function cacheProducts(products: OfflineProduct[]) {
  await offlineDb.products.clear();
  if (products.length > 0) await offlineDb.products.bulkPut(products);
}

// Cache customers locally
export async function cacheCustomers(customers: OfflineCustomer[]) {
  await offlineDb.customers.clear();
  if (customers.length > 0) await offlineDb.customers.bulkPut(customers);
}

// Find product by barcode offline
export async function findProductByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
  return offlineDb.products.where("barcode").equals(barcode).first();
}

// Add pending sale
export async function addPendingSale(sale: Omit<PendingSale, "clientId" | "synced">): Promise<string> {
  const clientId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await offlineDb.pendingSales.put({ ...sale, clientId, synced: false });
  return clientId;
}

// Get unsynced sales
export async function getUnsyncedSales(): Promise<PendingSale[]> {
  return offlineDb.pendingSales.where("synced").equals(0).toArray();
}

// Mark sale as synced
export async function markSaleSynced(clientId: string) {
  await offlineDb.pendingSales.update(clientId, { synced: true });
}

// Count pending
export async function getPendingCount(): Promise<number> {
  return offlineDb.pendingSales.where("synced").equals(0).count();
}
