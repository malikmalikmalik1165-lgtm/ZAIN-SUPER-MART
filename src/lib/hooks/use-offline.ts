"use client";

import { useState, useEffect, useCallback } from "react";
import { useNetworkStatus } from "./use-network-status";
import { getPendingCount } from "@/lib/offline/db";
import { syncPendingSales, type SyncStatus } from "@/lib/offline/sync";

export function useOffline() {
  const isOnline = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const refreshPending = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch { /* IndexedDB may not be available */ }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const doSync = async () => {
        setSyncStatus("syncing");
        try {
          const result = await syncPendingSales();
          setSyncStatus(result.failed > 0 ? "error" : "synced");
          await refreshPending();
          // Reset status after a delay
          setTimeout(() => setSyncStatus("idle"), 3000);
        } catch {
          setSyncStatus("error");
        }
      };
      doSync();
    }
  }, [isOnline, pendingCount, refreshPending]);

  // Poll pending count
  useEffect(() => {
    refreshPending();
    const interval = setInterval(refreshPending, 5000);
    return () => clearInterval(interval);
  }, [refreshPending]);

  return { isOnline, pendingCount, syncStatus, refreshPending };
}
