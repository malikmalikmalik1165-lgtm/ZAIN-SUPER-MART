"use client";

import { getUnsyncedSales, markSaleSynced, markSaleSyncError } from "./db";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export async function syncPendingSales(): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0, errors: ["Still offline"] };
  }

  const pending = await getUnsyncedSales();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const sale of pending) {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sale, offline_client_id: sale.clientId }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok || json.duplicate) {
        await markSaleSynced(sale.clientId);
        synced++;
      } else {
        const message = json.error || `Sync failed (${res.status})`;
        await markSaleSyncError(sale.clientId, message);
        errors.push(`${sale.clientId}: ${message}`);
        failed++;
      }
    } catch {
      const message = "Network error while synchronizing";
      await markSaleSyncError(sale.clientId, message);
      errors.push(`${sale.clientId}: ${message}`);
      failed++;
    }
  }

  return { synced, failed, errors };
}
