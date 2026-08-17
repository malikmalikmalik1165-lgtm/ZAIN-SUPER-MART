import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const barcode = request.nextUrl.searchParams.get("barcode");
    if (!barcode || barcode.trim().length === 0) {
      return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(id, name)")
      .eq("barcode", barcode.trim())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ data: null, found: false, barcode: barcode.trim() });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, found: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
