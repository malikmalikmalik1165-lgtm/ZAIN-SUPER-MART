import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false }).limit(200);
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
    const { category, amount, description, expense_date } = await request.json();
    if (!category?.trim()) return NextResponse.json({ error: "Category required" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
    const { data, error } = await supabase.from("expenses").insert({ category: category.trim(), amount, description: description?.trim() || null, expense_date: expense_date || new Date().toISOString().split("T")[0] }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
