import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

    const { data: products } = await supabase.from("products").select("id, stock_quantity, minimum_stock, is_active, purchase_price, sale_price");
    const { count: categoriesCount } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true);

    const activeProducts = products?.filter(p => p.is_active) || [];
    const lowStock = activeProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock);
    const outOfStock = activeProducts.filter(p => p.stock_quantity === 0);

    // Today's sales + profit
    let todaySales = 0, todayTransactions = 0, todayGrossProfit = 0;
    try {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data: salesData } = await supabase.from("sales").select("total, discount").eq("status", "completed").gte("created_at", start.toISOString());
      if (salesData) {
        todayTransactions = salesData.length;
        todaySales = salesData.reduce((s, sl) => s + (parseFloat(String(sl.total)) || 0), 0);
      }

      // Get sale items for profit calculation
      const { data: todaySalesList } = await supabase.from("sales").select("id").eq("status", "completed").gte("created_at", start.toISOString());
      if (todaySalesList && todaySalesList.length > 0) {
        const saleIds = todaySalesList.map(s => s.id);
        const { data: items } = await supabase.from("sale_items").select("product_id, quantity, unit_price, line_total").in("sale_id", saleIds);
        if (items && products) {
          const productMap = new Map(products.map(p => [p.id, p]));
          for (const item of items) {
            const prod = productMap.get(item.product_id);
            const cost = prod ? (parseFloat(String(prod.purchase_price)) || 0) * item.quantity : 0;
            todayGrossProfit += item.line_total - cost;
          }
        }
      }
    } catch { /* tables may not exist */ }

    // Today's expenses
    let todayExpenses = 0, totalExpenses = 0;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: todayExps } = await supabase.from("expenses").select("amount").eq("expense_date", today);
      if (todayExps) todayExpenses = todayExps.reduce((s, e) => s + (parseFloat(String(e.amount)) || 0), 0);
      const { data: allExps } = await supabase.from("expenses").select("amount");
      if (allExps) totalExpenses = allExps.reduce((s, e) => s + (parseFloat(String(e.amount)) || 0), 0);
    } catch { /* */ }

    // Customers
    let customersCount = 0, totalCredit = 0;
    try {
      const { data: custs } = await supabase.from("customers").select("balance").eq("is_active", true);
      if (custs) { customersCount = custs.length; totalCredit = custs.reduce((s, c) => s + (parseFloat(String(c.balance)) || 0), 0); }
    } catch { /* */ }

    const todayNetProfit = todayGrossProfit - todayExpenses;

    return NextResponse.json({
      data: {
        totalProducts: products?.length || 0,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStock.length,
        outOfStockProducts: outOfStock.length,
        totalCategories: categoriesCount || 0,
        todaySales,
        todayTransactions,
        todayGrossProfit: Math.round(todayGrossProfit * 100) / 100,
        todayExpenses,
        todayNetProfit: Math.round(todayNetProfit * 100) / 100,
        totalExpenses,
        customersCount,
        totalCredit,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
