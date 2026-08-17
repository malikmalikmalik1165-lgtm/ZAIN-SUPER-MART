import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyZsmSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const { amount, note } = await request.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    // Get customer
    const { data: cust, error: custErr } = await supabase.from("customers").select("balance").eq("id", id).single();
    if (custErr || !cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    // Record payment
    const { error: txErr } = await supabase.from("customer_transactions").insert({ customer_id: id, type: "payment", amount, note: note?.trim() || null });
    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
    // Update balance
    const { error: updErr } = await supabase.from("customers").update({ balance: Math.max(0, parseFloat(String(cust.balance)) - amount), updated_at: new Date().toISOString() }).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
