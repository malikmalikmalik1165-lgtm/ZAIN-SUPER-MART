import Dexie, { type Table } from "dexie";

export interface OfflineProduct {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  unit: string;
  sale_price: number;
  market_price: number;
  purchase_price: number;
  stock_quantity: number;
  minimum_stock: number;
  is_active: boolean;
}

export interface OfflineCategory {
  id: string;
  name: string;
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
  payment_method: string;
  amount_paid: number;
  change_amount: number;
  customer_id: string | null;
  created_at: string;
  synced: boolean;
  syncError?: string | null;
}

interface LocalSetting {
  key: string;
  value: string;
}

class ZsmOfflineDB extends Dexie {
  products!: Table<OfflineProduct, string>;
  categories!: Table<OfflineCategory, string>;
  customers!: Table<OfflineCustomer, string>;
  pendingSales!: Table<PendingSale, string>;
  settings!: Table<LocalSetting, string>;

  constructor() {
    super("zsm_offline");
    this.version(1).stores({
      products: "id, barcode, name",
      customers: "id, name",
      pendingSales: "clientId, synced",
    });
    this.version(2).stores({
      products: "id, barcode, name, category_id",
      categories: "id, name",
      customers: "id, name",
      pendingSales: "clientId, created_at",
      settings: "key",
    });
  }
}

export const offlineDb = new ZsmOfflineDB();

export async function cacheProducts(products: OfflineProduct[]) {
  await offlineDb.transaction("rw", offlineDb.products, async () => {
    await offlineDb.products.clear();
    if (products.length > 0) await offlineDb.products.bulkPut(products);
  });
}

export async function cacheCategories(categories: OfflineCategory[]) {
  await offlineDb.transaction("rw", offlineDb.categories, async () => {
    await offlineDb.categories.clear();
    if (categories.length > 0) await offlineDb.categories.bulkPut(categories);
  });
}

export async function cacheCustomers(customers: OfflineCustomer[]) {
  await offlineDb.transaction("rw", offlineDb.customers, async () => {
    await offlineDb.customers.clear();
    if (customers.length > 0) await offlineDb.customers.bulkPut(customers);
  });
}

export async function listOfflineProducts(search = "", categoryId = ""): Promise<OfflineProduct[]> {
  const all = await offlineDb.products.toArray();
  const needle = search.trim().toLowerCase();
  return all
    .filter((p) => p.is_active)
    .filter((p) => !categoryId || p.category_id === categoryId)
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.barcode?.toLowerCase() === needle)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listOfflineCategories(): Promise<OfflineCategory[]> {
  const all = await offlineDb.categories.toArray();
  return all.filter((category) => category.is_active).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listOfflineCustomers(): Promise<OfflineCustomer[]> {
  return offlineDb.customers.orderBy("name").toArray();
}

export async function findProductByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
  return offlineDb.products.where("barcode").equals(barcode.trim()).first();
}

export async function addPendingSale(sale: Omit<PendingSale, "clientId" | "synced" | "syncError">): Promise<string> {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const clientId = `zsm-offline-${uuid}`;
  await offlineDb.pendingSales.put({ ...sale, clientId, synced: false, syncError: null });
  return clientId;
}

export async function createPendingSaleWithStock(
  sale: Omit<PendingSale, "clientId" | "synced" | "syncError">
): Promise<string> {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const clientId = `zsm-offline-${uuid}`;

  await offlineDb.transaction("rw", offlineDb.products, offlineDb.pendingSales, async () => {
    for (const item of sale.items) {
      const product = await offlineDb.products.get(item.product_id);
      if (!product || product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient cached stock for ${product?.name || item.product_name}`);
      }
    }

    for (const item of sale.items) {
      const product = await offlineDb.products.get(item.product_id);
      if (product) {
        await offlineDb.products.update(item.product_id, {
          stock_quantity: product.stock_quantity - item.quantity,
        });
      }
    }

    await offlineDb.pendingSales.put({
      ...sale,
      clientId,
      synced: false,
      syncError: null,
    });
  });

  // Background Sync where available; online event + polling remain the fallback.
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        const syncRegistration = registration as ServiceWorkerRegistration & {
          sync?: { register: (tag: string) => Promise<void> };
        };
        return syncRegistration.sync?.register("zsm-sync-sales");
      })
      .catch(() => undefined);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("zsm-offline-sale-queued"));
  }

  return clientId;
}

// Kept for targeted local corrections; checkout uses createPendingSaleWithStock.
export async function decrementOfflineStock(items: { product_id: string; quantity: number }[]) {
  await offlineDb.transaction("rw", offlineDb.products, async () => {
    for (const item of items) {
      const product = await offlineDb.products.get(item.product_id);
      if (!product || product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient cached stock for ${product?.name || item.product_id}`);
      }
      await offlineDb.products.update(item.product_id, {
        stock_quantity: product.stock_quantity - item.quantity,
      });
    }
  });
}

export async function getUnsyncedSales(): Promise<PendingSale[]> {
  return offlineDb.pendingSales.filter((sale) => !sale.synced).toArray();
}

export async function markSaleSynced(clientId: string) {
  await offlineDb.pendingSales.update(clientId, { synced: true, syncError: null });
}

export async function markSaleSyncError(clientId: string, syncError: string) {
  await offlineDb.pendingSales.update(clientId, { syncError });
}

export async function getPendingCount(): Promise<number> {
  return offlineDb.pendingSales.filter((sale) => !sale.synced).count();
}

export async function setOfflineSetting(key: string, value: string) {
  await offlineDb.settings.put({ key, value });
}

export async function getOfflineSetting(key: string): Promise<string | null> {
  return (await offlineDb.settings.get(key))?.value ?? null;
}
