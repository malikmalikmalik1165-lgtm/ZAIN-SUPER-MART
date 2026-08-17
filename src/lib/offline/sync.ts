"use client";

import { getUnsyncedSales, markSaleSynced } from "./db";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export async function syncPendingSales(): Promise<{ synced: number; failed: number }> {
  const pending = await getUnsyncedSales();
  let synced = 0;
  let failed = 0;

  for (const sale of pending) {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sale,
          offline_client_id: sale.clientId, // idempotency key
        }),
      });

      if (res.ok) {
        await markSaleSynced(sale.clientId);
        synced++;
      } else {
        const json = await res.json();
        // If duplicate (already synced), mark as synced
        if (json.error?.includes("duplicate") || json.error?.includes("already")) {
          await markSaleSynced(sale.clientId);
          synced++;
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
