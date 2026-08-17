import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.code === "PGRST116" ? "Not found" : error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
    // Get transactions
    const { data: txs } = await supabase.from("customer_transactions").select("*").eq("customer_id", id).order("created_at", { ascending: false });
    return NextResponse.json({ data: { ...data, transactions: txs || [] } });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyZsmSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const body = await request.json();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.phone !== undefined) update.phone = body.phone?.trim() || null;
    if (body.address !== undefined) update.address = body.address?.trim() || null;
    const { data, error } = await supabase.from("customers").update(update).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
