import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Generate a unique internal barcode: ZSM + timestamp + random
function generateInternalBarcode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000).toString();
  return `ZSM${ts}${rand}`;
}

export async function POST() {
  try {
    const user = await verifyZsmSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Generate and verify uniqueness (up to 5 retries)
    for (let i = 0; i < 5; i++) {
      const barcode = generateInternalBarcode();

      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("barcode", barcode)
        .limit(1);

      if (!existing || existing.length === 0) {
        return NextResponse.json({ data: { barcode } });
      }
    }

    return NextResponse.json({ error: "Failed to generate unique barcode" }, { status: 500 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
