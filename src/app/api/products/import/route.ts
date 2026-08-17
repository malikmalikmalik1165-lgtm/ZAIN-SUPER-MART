import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ImportRow {
  name: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchase_price?: number;
  sale_price?: number;
  stock_quantity?: number;
  minimum_stock?: number;
}

interface ImportResult {
  row: number;
  name: string;
  status: "success" | "error";
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyZsmSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { rows, generateMissingBarcodes } = body as {
      rows: ImportRow[];
      generateMissingBarcodes: boolean;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data to import" }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: "Maximum 500 rows per import" }, { status: 400 });
    }

    // Get existing categories for name matching
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true);
    const categoryMap = new Map(
      (categories || []).map((c) => [c.name.toLowerCase(), c.id])
    );

    // Get existing barcodes for duplicate check
    const { data: existingProducts } = await supabase
      .from("products")
      .select("barcode")
      .not("barcode", "is", null);
    const existingBarcodes = new Set(
      (existingProducts || []).map((p) => p.barcode).filter(Boolean)
    );

    const results: ImportResult[] = [];
    const seenBarcodes = new Set<string>();
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Validate name
      if (!row.name || row.name.trim().length === 0) {
        results.push({ row: rowNum, name: row.name || "(empty)", status: "error", error: "Product name is required" });
        continue;
      }

      // Validate prices
      const purchasePrice = parseFloat(String(row.purchase_price)) || 0;
      const salePrice = parseFloat(String(row.sale_price)) || 0;
      if (purchasePrice < 0 || salePrice < 0) {
        results.push({ row: rowNum, name: row.name, status: "error", error: "Prices cannot be negative" });
        continue;
      }

      // Validate stock
      const stockQty = parseInt(String(row.stock_quantity)) || 0;
      const minStock = parseInt(String(row.minimum_stock)) || 0;
      if (stockQty < 0 || minStock < 0) {
        results.push({ row: rowNum, name: row.name, status: "error", error: "Stock cannot be negative" });
        continue;
      }

      // Handle barcode
      let barcode = row.barcode?.trim() || null;

      if (barcode) {
        // Check duplicate in Excel
        if (seenBarcodes.has(barcode)) {
          results.push({ row: rowNum, name: row.name, status: "error", error: `Duplicate barcode in import: ${barcode}` });
          continue;
        }
        // Check duplicate in database
        if (existingBarcodes.has(barcode)) {
          results.push({ row: rowNum, name: row.name, status: "error", error: `Barcode already exists in database: ${barcode}` });
          continue;
        }
        seenBarcodes.add(barcode);
      } else if (generateMissingBarcodes) {
        // Generate unique ZSM barcode
        for (let attempt = 0; attempt < 5; attempt++) {
          const ts = Date.now().toString(36).toUpperCase();
          const rand = Math.floor(1000 + Math.random() * 9000);
          const candidate = `ZSM${ts}${rand}`;
          if (!seenBarcodes.has(candidate) && !existingBarcodes.has(candidate)) {
            barcode = candidate;
            seenBarcodes.add(candidate);
            break;
          }
        }
      }

      // Resolve category
      let categoryId: string | null = null;
      if (row.category && row.category.trim()) {
        categoryId = categoryMap.get(row.category.trim().toLowerCase()) || null;
      }

      // Insert product
      const { error: insertError } = await supabase.from("products").insert({
        name: row.name.trim(),
        barcode,
        category_id: categoryId,
        unit: row.unit?.trim() || "piece",
        purchase_price: purchasePrice,
        sale_price: salePrice,
        stock_quantity: stockQty,
        minimum_stock: minStock,
        is_active: true,
      });

      if (insertError) {
        results.push({ row: rowNum, name: row.name, status: "error", error: insertError.message });
      } else {
        results.push({ row: rowNum, name: row.name, status: "success" });
        successCount++;
        if (barcode) existingBarcodes.add(barcode);
      }
    }

    return NextResponse.json({
      data: {
        total: rows.length,
        success: successCount,
        errors: rows.length - successCount,
        results,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
