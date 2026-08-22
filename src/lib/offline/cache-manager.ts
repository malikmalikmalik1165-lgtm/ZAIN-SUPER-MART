"use client";

import {
  cacheProducts,
  cacheCategories,
  cacheCustomers,
  setOfflineSetting,
  type OfflineProduct,
  type OfflineCategory,
  type OfflineCustomer,
} from "./db";

export interface CacheSummary {
  products: number;
  categories: number;
  customers: number;
  cachedAt: string;
}

/**
 * Cache operational data while authenticated and online.
 * Supabase remains authoritative; IndexedDB is only the offline working copy.
 */
export async function preCacheData(): Promise<CacheSummary> {
  if (!navigator.onLine) {
    throw new Error("Cannot refresh offline cache without a connection");
  }

  const summary: CacheSummary = {
    products: 0,
    categories: 0,
    customers: 0,
    cachedAt: new Date().toISOString(),
  };

  const [prodRes, categoryRes, customerRes] = await Promise.all([
    fetch("/api/products?limit=500&active=true", { credentials: "include" }),
    fetch("/api/categories?active=true", { credentials: "include" }),
    fetch("/api/customers", { credentials: "include" }),
  ]);

  if (prodRes.ok) {
    const prodJson = await prodRes.json();
    const products: OfflineProduct[] = (prodJson.data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      barcode: (p.barcode as string) || null,
      category_id: (p.category_id as string) || null,
      unit: (p.unit as string) || "piece",
      sale_price: parseFloat(String(p.sale_price)) || 0,
      market_price: parseFloat(String(p.market_price)) || 0,
      purchase_price: parseFloat(String(p.purchase_price)) || 0,
      stock_quantity: parseInt(String(p.stock_quantity)) || 0,
      minimum_stock: parseInt(String(p.minimum_stock)) || 0,
      is_active: p.is_active !== false,
    }));
    await cacheProducts(products);
    summary.products = products.length;
  }

  if (categoryRes.ok) {
    const json = await categoryRes.json();
    const categories: OfflineCategory[] = (json.data || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      is_active: c.is_active !== false,
    }));
    await cacheCategories(categories);
    summary.categories = categories.length;
  }

  if (customerRes.ok) {
    const json = await customerRes.json();
    const customers: OfflineCustomer[] = (json.data || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      phone: (c.phone as string) || null,
      balance: parseFloat(String(c.balance)) || 0,
    }));
    await cacheCustomers(customers);
    summary.customers = customers.length;
  }

  await setOfflineSetting("last_cache_at", summary.cachedAt);
  await setOfflineSetting("store_name", "ZAIN SUPER MART");

  // Ask the service worker to cache authenticated app pages and loaded assets.
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "CACHE_AUTHENTICATED_SHELL" });
  }

  return summary;
}
