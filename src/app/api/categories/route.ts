import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyZsmSession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: List all categories
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") === "true";
    const search = searchParams.get("search") || "";

    let query = supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Categories fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST: Create a new category
export async function POST(request: NextRequest) {
  try {
    const user = await verifyZsmSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { name, description, is_active = true } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Category name must be 100 characters or less" }, { status: 400 });
    }

    // Check for duplicate name (case-insensitive)
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", name.trim())
      .eq("is_active", true)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("Category create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
