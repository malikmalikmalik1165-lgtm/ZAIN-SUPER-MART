import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface HealthStatus {
  ok: boolean;
  timestamp: string;
  services: {
    database: {
      status: "connected" | "not-available" | "error";
      type: string;
    };
    supabase: {
      status: "configured" | "not-configured";
      note: string;
    };
  };
  project: "ZAIN SUPER MART";
}

export async function GET() {
  const status: HealthStatus = {
    ok: false,
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: "not-available",
        type: "sandbox-postgresql",
      },
      supabase: {
        status: "not-configured",
        note: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      },
    },
    project: "ZAIN SUPER MART",
  };

  // Check sandbox PostgreSQL (only available in development/sandbox)
  if (db) {
    try {
      await db.execute(sql`select 1`);
      status.services.database.status = "connected";
    } catch {
      status.services.database.status = "error";
    }
  } else {
    status.services.database.status = "not-available";
    status.services.database.type = "not-configured (Vercel production)";
  }

  // Check Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseUrl.includes("supabase.co")
  ) {
    status.services.supabase.status = "configured";
    status.services.supabase.note = "Supabase project connected";
  }

  // Health is OK if Supabase is configured (primary database)
  // OR if local database is connected (sandbox mode)
  status.ok =
    status.services.supabase.status === "configured" ||
    status.services.database.status === "connected";

  return Response.json(status, {
    status: status.ok ? 200 : 500,
  });
}
