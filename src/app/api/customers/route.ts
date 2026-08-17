import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const search = request.nextUrl.searchParams.get("search") || "";
    let query = supabase.from("customers").select("*").eq("is_active", true).order("name");
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await query;
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
    const { name, phone, address } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    const { data, error } = await supabase.from("customers").insert({ name: name.trim(), phone: phone?.trim() || null, address: address?.trim() || null }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 }); }
}
