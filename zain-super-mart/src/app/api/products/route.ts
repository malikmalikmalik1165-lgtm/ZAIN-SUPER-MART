import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: List all products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id");
    const stockStatus = searchParams.get("stock_status");
    const activeOnly = searchParams.get("active") !== "false";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select("*, category:categories(*)", { count: "exact" })
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    // Stock status filtering (out_of_stock can be done server-side)
    if (stockStatus === "out_of_stock") {
      query = query.eq("stock_quantity", 0);
    }
    // Note: low_stock and in_stock filtering done after fetch since
    // we need to compare stock_quantity with minimum_stock per row

    const { data, error, count } = await query;

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter low stock on server if needed
    let filteredData = data;
    if (stockStatus === "low_stock") {
      filteredData = data?.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock
      );
    } else if (stockStatus === "in_stock") {
      filteredData = data?.filter((p) => p.stock_quantity > p.minimum_stock);
    }

    return NextResponse.json({
      data: filteredData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(request: NextRequest) {
  try {
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
      is_active = true,
    } = body;

    // Validation
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push("Product name is required");
    }

    if (!unit) {
      errors.push("Unit is required");
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

    // Check for duplicate barcode if provided
    if (barcode && barcode.trim().length > 0) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("barcode", barcode.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: "A product with this barcode already exists" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        barcode: barcode?.trim() || null,
        category_id: category_id || null,
        unit,
        purchase_price: purchase_price || 0,
        sale_price: sale_price || 0,
        stock_quantity: stock_quantity || 0,
        minimum_stock: minimum_stock || 0,
        is_active,
      })
      .select("*, category:categories(*)")
      .single();

    if (error) {
      console.error("Product create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
