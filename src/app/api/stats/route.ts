import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Get product stats
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, stock_quantity, minimum_stock, is_active");

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // Get category count
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    // Calculate product stats
    const activeProducts = products?.filter((p) => p.is_active) || [];
    const lowStockProducts = activeProducts.filter(
      (p) => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock
    );
    const outOfStockProducts = activeProducts.filter((p) => p.stock_quantity === 0);

    // Get today's sales stats
    let todaySales = 0;
    let todayTransactions = 0;
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: salesData } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("created_at", startOfDay.toISOString());

      if (salesData) {
        todayTransactions = salesData.length;
        todaySales = salesData.reduce((sum, s) => sum + (parseFloat(String(s.total)) || 0), 0);
      }
    } catch {
      // sales table may not exist yet — gracefully handle
    }

    return NextResponse.json({
      data: {
        totalProducts: products?.length || 0,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        totalCategories: categoriesCount || 0,
        todaySales,
        todayTransactions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
