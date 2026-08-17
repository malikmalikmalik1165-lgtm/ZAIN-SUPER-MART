import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const { data, error } = await supabase.from("purchases").select("*, supplier:suppliers(name)").order("created_at", { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyZsmSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const { supplier_id, items, notes } = await request.json();
    if (!items?.length) return NextResponse.json({ error: "Items required" }, { status: 400 });
    const total = items.reduce((s: number, i: { quantity: number; unit_cost: number }) => s + i.quantity * i.unit_cost, 0);
    const pNum = `PUR-${Date.now().toString(36).toUpperCase()}`;
    const { data: purchase, error: pErr } = await supabase.from("purchases").insert({ purchase_number: pNum, supplier_id: supplier_id || null, total, notes: notes?.trim() || null }).select().single();
    if (pErr || !purchase) return NextResponse.json({ error: pErr?.message || "Failed" }, { status: 500 });
    // Insert items + increase stock
    for (const item of items) {
      await supabase.from("purchase_items").insert({ purchase_id: purchase.id, product_id: item.product_id, product_name: item.product_name, quantity: item.quantity, unit_cost: item.unit_cost, line_total: item.quantity * item.unit_cost });
      // Increase stock
      const { data: prod } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
      if (prod) {
        const prev = prod.stock_quantity;
        const newQty = prev + item.quantity;
        await supabase.from("products").update({ stock_quantity: newQty, purchase_price: item.unit_cost, updated_at: new Date().toISOString() }).eq("id", item.product_id);
        await supabase.from("inventory_movements").insert({ product_id: item.product_id, movement_type: "STOCK_IN", quantity: item.quantity, previous_stock: prev, new_stock: newQty, note: `Purchase ${pNum}` });
      }
    }
    return NextResponse.json({ data: purchase }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
