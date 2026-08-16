import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("id", id)
      .single();

    if (saleError) {
      if (saleError.code === "PGRST116") {
        return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      }
      return NextResponse.json({ error: saleError.message }, { status: 500 });
    }

    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { ...sale, items: items || [] } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
