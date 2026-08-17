import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

    const { data: products } = await supabase.from("products").select("id, stock_quantity, minimum_stock, is_active");
    const { count: categoriesCount } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true);

    const activeProducts = products?.filter(p => p.is_active) || [];
    const lowStock = activeProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock);
    const outOfStock = activeProducts.filter(p => p.stock_quantity === 0);

    // Today's sales
    let todaySales = 0, todayTransactions = 0;
    try {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data: salesData } = await supabase.from("sales").select("total").eq("status", "completed").gte("created_at", start.toISOString());
      if (salesData) { todayTransactions = salesData.length; todaySales = salesData.reduce((s, sl) => s + (parseFloat(String(sl.total)) || 0), 0); }
    } catch { /* tables may not exist */ }

    // Customers count + credit
    let customersCount = 0, totalCredit = 0;
    try {
      const { data: custs } = await supabase.from("customers").select("balance").eq("is_active", true);
      if (custs) { customersCount = custs.length; totalCredit = custs.reduce((s, c) => s + (parseFloat(String(c.balance)) || 0), 0); }
    } catch { /* */ }

    // Expenses
    let totalExpenses = 0;
    try {
      const { data: exps } = await supabase.from("expenses").select("amount");
      if (exps) totalExpenses = exps.reduce((s, e) => s + (parseFloat(String(e.amount)) || 0), 0);
    } catch { /* */ }

    return NextResponse.json({
      data: {
        totalProducts: products?.length || 0,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStock.length,
        outOfStockProducts: outOfStock.length,
        totalCategories: categoriesCount || 0,
        todaySales,
        todayTransactions,
        customersCount,
        totalCredit,
        totalExpenses,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
