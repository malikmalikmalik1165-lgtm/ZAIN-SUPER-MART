"use client";

import { cacheProducts, cacheCustomers, type OfflineProduct, type OfflineCustomer } from "./db";

/**
 * Pre-cache essential data for offline POS operation.
 * Called after login and periodically while online.
 */
export async function preCacheData() {
  try {
    // Cache products
    const prodRes = await fetch("/api/products?limit=500&active=true");
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      if (prodJson.data) {
        const products: OfflineProduct[] = prodJson.data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          barcode: (p.barcode as string) || null,
          category_id: (p.category_id as string) || null,
          unit: (p.unit as string) || "piece",
          sale_price: parseFloat(String(p.sale_price)) || 0,
          purchase_price: parseFloat(String(p.purchase_price)) || 0,
          stock_quantity: parseInt(String(p.stock_quantity)) || 0,
          is_active: p.is_active !== false,
        }));
        await cacheProducts(products);
        console.log(`[ZSM Offline] Cached ${products.length} products`);
      }
    }

    // Cache customers
    const custRes = await fetch("/api/customers");
    if (custRes.ok) {
      const custJson = await custRes.json();
      if (custJson.data) {
        const customers: OfflineCustomer[] = custJson.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          phone: (c.phone as string) || null,
          balance: parseFloat(String(c.balance)) || 0,
        }));
        await cacheCustomers(customers);
        console.log(`[ZSM Offline] Cached ${customers.length} customers`);
      }
    }
  } catch (err) {
    console.warn("[ZSM Offline] Cache failed:", err);
  }
}
