import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: List inventory movements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("product_id");
    const movementType = searchParams.get("movement_type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("inventory_movements")
      .select("*, product:products(id, name, unit)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (movementType) {
      query = query.eq("movement_type", movementType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Inventory movements fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST: Create a stock adjustment
export async function POST(request: NextRequest) {
  try {
    const zsmUser = await verifyZsmSession();
    if (!zsmUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { product_id, movement_type, quantity, note } = body;

    // Validation
    if (!product_id) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 });
    }

    if (!movement_type || !["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"].includes(movement_type)) {
      return NextResponse.json({ error: "Valid movement type is required" }, { status: 400 });
    }

    if (quantity === undefined || quantity === null || quantity === 0) {
      return NextResponse.json({ error: "Quantity is required and must not be zero" }, { status: 400 });
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, stock_quantity")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const previousStock = product.stock_quantity;
    let newStock: number;

    // Calculate new stock based on movement type
    if (movement_type === "STOCK_IN") {
      newStock = previousStock + Math.abs(quantity);
    } else if (movement_type === "STOCK_OUT") {
      newStock = previousStock - Math.abs(quantity);
      if (newStock < 0) {
        return NextResponse.json(
          { error: `Insufficient stock. Current stock: ${previousStock}` },
          { status: 400 }
        );
      }
    } else {
      // ADJUSTMENT: quantity can be positive or negative, or absolute
      // If quantity is the target stock level
      newStock = Math.max(0, quantity);
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create movement record
    const { data: movement, error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        product_id,
        movement_type,
        quantity: movement_type === "ADJUSTMENT" ? newStock - previousStock : Math.abs(quantity),
        previous_stock: previousStock,
        new_stock: newStock,
        note: note?.trim() || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (movementError) {
      console.error("Movement create error:", movementError);
      return NextResponse.json({ error: movementError.message }, { status: 500 });
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from("products")
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product_id);

    if (updateError) {
      console.error("Product stock update error:", updateError);
      // Try to rollback the movement
      await supabase.from("inventory_movements").delete().eq("id", movement.id);
      return NextResponse.json({ error: "Failed to update product stock" }, { status: 500 });
    }

    return NextResponse.json({
      data: movement,
      product: {
        id: product_id,
        name: product.name,
        previous_stock: previousStock,
        new_stock: newStock,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
