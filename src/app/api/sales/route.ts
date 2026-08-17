import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Generate sale number: ZSM-YYYYMMDD-XXXX
function generateSaleNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ZSM-${date}-${rand}`;
}

// GET: List sales
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const today = searchParams.get("today") === "true";

    let query = supabase
      .from("sales")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (today) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = query.gte("created_at", startOfDay.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST: Create a new sale (atomic: sale + items + stock deduction + movements)
export async function POST(request: NextRequest) {
  try {
    const zsmUser = await verifyZsmSession();
    if (!zsmUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { items, subtotal, discount, total, payment_method, amount_paid, change_amount, notes } = body;

    // === SERVER-SIDE VALIDATION ===
    const errors: string[] = [];

    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push("Cart is empty");
    }
    if (!payment_method || !["cash", "card", "credit", "other"].includes(payment_method)) {
      errors.push("Invalid payment method");
    }
    if (total === undefined || total <= 0) {
      errors.push("Total must be greater than zero");
    }
    if (payment_method === "cash" && (amount_paid === undefined || amount_paid < total)) {
      errors.push("Amount paid must be at least equal to total for cash payment");
    }
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
    }

    // === VALIDATE PRODUCTS AND STOCK SERVER-SIDE ===
    const productIds = items.map((i: { product_id: string }) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, sale_price, stock_quantity, is_active")
      .in("id", productIds);

    if (productsError || !products) {
      return NextResponse.json({ error: "Failed to verify products" }, { status: 500 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Server-side recalculation of totals
    let serverSubtotal = 0;
    const validatedItems: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      discount: number;
      line_total: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 });
      }
      if (!product.is_active) {
        return NextResponse.json({ error: `Product is inactive: ${product.name}` }, { status: 400 });
      }
      if (item.quantity <= 0) {
        return NextResponse.json({ error: `Invalid quantity for ${product.name}` }, { status: 400 });
      }
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` },
          { status: 400 }
        );
      }

      const unitPrice = product.sale_price;
      const itemDiscount = parseFloat(item.discount) || 0;
      const lineTotal = unitPrice * item.quantity - itemDiscount;

      serverSubtotal += lineTotal;
      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount: itemDiscount,
        line_total: Math.max(0, lineTotal),
      });
    }

    const serverDiscount = parseFloat(discount) || 0;
    const serverTotal = Math.max(0, serverSubtotal - serverDiscount);
    const serverAmountPaid = parseFloat(amount_paid) || 0;
    const serverChange = payment_method === "cash" ? Math.max(0, serverAmountPaid - serverTotal) : 0;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // === CREATE SALE ===
    const saleNumber = generateSaleNumber();

    const customer_id = body.customer_id || null;

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        sale_number: saleNumber,
        customer_id,
        subtotal: serverSubtotal,
        discount: serverDiscount,
        total: serverTotal,
        payment_method,
        amount_paid: serverAmountPaid,
        change_amount: serverChange,
        status: "completed",
        notes: notes?.trim() || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (saleError || !sale) {
      // If duplicate sale_number, retry once
      if (saleError?.code === "23505") {
        const retryNumber = generateSaleNumber();
        const { data: retrySale, error: retryError } = await supabase
          .from("sales")
          .insert({
            sale_number: retryNumber,
            subtotal: serverSubtotal,
            discount: serverDiscount,
            total: serverTotal,
            payment_method,
            amount_paid: serverAmountPaid,
            change_amount: serverChange,
            status: "completed",
            notes: notes?.trim() || null,
            created_by: user?.id || null,
          })
          .select()
          .single();
        if (retryError || !retrySale) {
          return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
        }
        // Continue with retrySale
        return await completeSale(supabase, retrySale, validatedItems, productMap, user?.id || null);
      }
      return NextResponse.json({ error: saleError?.message || "Failed to create sale" }, { status: 500 });
    }

    return await completeSale(supabase, sale, validatedItems, productMap, user?.id || null);
  } catch (error) {
    console.error("Sales POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Helper: complete sale with items, stock deduction, movements
async function completeSale(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> & object,
  sale: { id: string; sale_number: string; total: number; customer_id?: string | null; payment_method?: string },
  items: { product_id: string; product_name: string; quantity: number; unit_price: number; discount: number; line_total: number }[],
  productMap: Map<string, { id: string; name: string; sale_price: number; stock_quantity: number; is_active: boolean }>,
  userId: string | null
) {
  // === INSERT SALE ITEMS ===
  const saleItems = items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    line_total: item.line_total,
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);

  if (itemsError) {
    // Rollback: delete the sale
    await supabase.from("sales").delete().eq("id", sale.id);
    return NextResponse.json({ error: "Failed to save sale items" }, { status: 500 });
  }

  // === DEDUCT STOCK + CREATE INVENTORY MOVEMENTS ===
  for (const item of items) {
    const product = productMap.get(item.product_id)!;
    const previousStock = product.stock_quantity;
    const newStock = previousStock - item.quantity;

    // Update product stock
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq("id", item.product_id);

    if (stockError) {
      // Rollback: delete items and sale
      await supabase.from("sale_items").delete().eq("sale_id", sale.id);
      await supabase.from("sales").delete().eq("id", sale.id);
      return NextResponse.json({ error: `Failed to update stock for ${item.product_name}` }, { status: 500 });
    }

    // Create inventory movement
    await supabase.from("inventory_movements").insert({
      product_id: item.product_id,
      movement_type: "STOCK_OUT",
      quantity: item.quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      note: `Sale ${sale.sale_number}`,
      created_by: userId,
    });

    // Update local product map for subsequent items of same product
    product.stock_quantity = newStock;
  }

  // Handle credit sale - record customer transaction
  if (sale.customer_id && sale.payment_method === "credit") {
    await supabase.from("customer_transactions").insert({
      customer_id: sale.customer_id,
      type: "credit",
      amount: sale.total,
      sale_id: sale.id,
      note: `Sale ${sale.sale_number}`,
    });
    // Update customer balance
    const { data: cust } = await supabase.from("customers").select("balance").eq("id", sale.customer_id).single();
    if (cust) {
      await supabase.from("customers").update({
        balance: parseFloat(String(cust.balance)) + sale.total,
        total_credit: parseFloat(String(cust.balance)) + sale.total,
        updated_at: new Date().toISOString(),
      }).eq("id", sale.customer_id);
    }
  }

  return NextResponse.json({
    data: { ...sale, items: saleItems },
  }, { status: 201 });
}
