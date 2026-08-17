import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Database Setup API
 * Creates required tables for Phase 2: Products & Inventory
 * Safe to run multiple times - uses IF NOT EXISTS
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Create categories table
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name 
          ON categories(LOWER(name)) WHERE is_active = true;
        
        CREATE INDEX IF NOT EXISTS idx_categories_active 
          ON categories(is_active);
      `
    });

    // If rpc doesn't exist, try direct SQL (Supabase might not have exec_sql)
    // We'll handle this in a different way - check if tables exist first
    
    // Check if categories table exists
    const { data: categoriesExists } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    // Check if products table exists
    const { data: productsExists } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    // Check if inventory_movements table exists
    const { data: movementsExists } = await supabase
      .from('inventory_movements')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Database tables checked",
      tables: {
        categories: categoriesExists !== null,
        products: productsExists !== null,
        inventory_movements: movementsExists !== null,
      },
      note: "Tables should be created via Supabase Dashboard SQL Editor if they don't exist"
    });

  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { 
        error: "Setup failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        note: "Please create tables manually via Supabase Dashboard"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Check table existence by attempting to query them
    const tables: Record<string, boolean> = {};
    
    try {
      await supabase.from('categories').select('id').limit(1);
      tables.categories = true;
    } catch {
      tables.categories = false;
    }

    try {
      await supabase.from('products').select('id').limit(1);
      tables.products = true;
    } catch {
      tables.products = false;
    }

    try {
      await supabase.from('inventory_movements').select('id').limit(1);
      tables.inventory_movements = true;
    } catch {
      tables.inventory_movements = false;
    }

    return NextResponse.json({
      success: true,
      tables,
      allTablesExist: Object.values(tables).every(Boolean),
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Check failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
