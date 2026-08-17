import { createServerSupabaseClient } from "@/lib/supabase/server";
import { lookupExternalProduct } from "@/lib/barcode/external-lookup";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const barcode = request.nextUrl.searchParams.get("barcode");
    if (!barcode || barcode.trim().length === 0) {
      return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
    }

    const cleanBarcode = barcode.trim();

    // ========== LEVEL 1: ZSM Database ==========
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(id, name)")
        .eq("barcode", cleanBarcode)
        .single();

      if (!error && data) {
        return NextResponse.json({
          found: true,
          source: "zsm",
          data,
          barcode: cleanBarcode,
        });
      }
    }

    // ========== LEVEL 2: External Product Database ==========
    try {
      const external = await lookupExternalProduct(cleanBarcode);

      if (external && external.name) {
        return NextResponse.json({
          found: true,
          source: "external",
          barcode: cleanBarcode,
          external: {
            name: external.name,
            brand: external.brand,
            category: external.category,
            description: external.description,
            image_url: external.image_url,
            pack_size: external.pack_size,
            source: external.source,
          },
        });
      }
    } catch {
      // External lookup failed — continue to not-found
    }

    // ========== LEVEL 3: Not Found ==========
    return NextResponse.json({
      found: false,
      source: null,
      barcode: cleanBarcode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
