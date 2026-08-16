import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Get a single product
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

    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT: Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      name,
      barcode,
      category_id,
      unit,
      purchase_price,
      sale_price,
      stock_quantity,
      minimum_stock,
      is_active,
    } = body;

    // Validation
    const errors: string[] = [];

    if (name !== undefined && (!name || name.trim().length === 0)) {
      errors.push("Product name is required");
    }

    if (purchase_price !== undefined && purchase_price < 0) {
      errors.push("Purchase price cannot be negative");
    }

    if (sale_price !== undefined && sale_price < 0) {
      errors.push("Sale price cannot be negative");
    }

    if (stock_quantity !== undefined && stock_quantity < 0) {
      errors.push("Stock quantity cannot be negative");
    }

    if (minimum_stock !== undefined && minimum_stock < 0) {
      errors.push("Minimum stock cannot be negative");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    // Check for duplicate barcode if provided (excluding current product)
    if (barcode && barcode.trim().length > 0) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("barcode", barcode.trim())
        .neq("id", id)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: "A product with this barcode already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (barcode !== undefined) updateData.barcode = barcode?.trim() || null;
    if (category_id !== undefined) updateData.category_id = category_id || null;
    if (unit !== undefined) updateData.unit = unit;
    if (purchase_price !== undefined) updateData.purchase_price = purchase_price;
    if (sale_price !== undefined) updateData.sale_price = sale_price;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (minimum_stock !== undefined) updateData.minimum_stock = minimum_stock;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("*, category:categories(*)")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE: Deactivate a product (not hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Product deactivated" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
