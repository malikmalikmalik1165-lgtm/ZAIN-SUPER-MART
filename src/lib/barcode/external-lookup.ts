/**
 * ZAIN SUPER MART — External Barcode Product Lookup
 * 
 * Abstraction layer for external barcode/product databases.
 * Currently uses Open Food Facts (free, no API key required)
 * and UPC Item DB as fallback.
 * 
 * Can be replaced with any provider without changing the rest of the app.
 */

export interface ExternalProduct {
  name: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  pack_size: string | null;
  barcode: string;
  source: string;
}

/**
 * Look up a barcode in external product databases.
 * Returns product info if found, null if not.
 * Server-side only — never call from browser.
 */
export async function lookupExternalProduct(barcode: string): Promise<ExternalProduct | null> {
  // Try Open Food Facts first (free, global, good for grocery products)
  try {
    const result = await lookupOpenFoodFacts(barcode);
    if (result) return result;
  } catch {
    // Continue to next provider
  }

  // Try UPC Item DB (free tier)
  try {
    const result = await lookupUpcItemDb(barcode);
    if (result) return result;
  } catch {
    // Continue
  }

  return null;
}

// Provider 1: Open Food Facts (free, no API key)
async function lookupOpenFoodFacts(barcode: string): Promise<ExternalProduct | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "ZainSuperMart/1.0" },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    return {
      name: p.product_name || p.product_name_en || null,
      brand: p.brands || null,
      category: p.categories?.split(",")[0]?.trim() || null,
      description: p.generic_name || p.generic_name_en || null,
      image_url: p.image_url || p.image_front_url || null,
      pack_size: p.quantity || null,
      barcode,
      source: "Open Food Facts",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Provider 2: UPC Item DB (free, no key for basic lookup)
async function lookupUpcItemDb(barcode: string): Promise<ExternalProduct | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      {
        signal: controller.signal,
        headers: { "Accept": "application/json" },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.items || json.items.length === 0) return null;

    const item = json.items[0];
    return {
      name: item.title || null,
      brand: item.brand || null,
      category: item.category || null,
      description: item.description || null,
      image_url: item.images?.[0] || null,
      pack_size: item.size || null,
      barcode,
      source: "UPC Item DB",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
