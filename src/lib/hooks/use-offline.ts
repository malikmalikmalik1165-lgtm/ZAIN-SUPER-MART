"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNetworkStatus } from "./use-network-status";
import { getPendingCount } from "@/lib/offline/db";
import { syncPendingSales, type SyncStatus } from "@/lib/offline/sync";

export function useOffline() {
  const isOnline = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    try {
      setPendingCount(await getPendingCount());
    } catch {
      setPendingCount(0);
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setSyncStatus("syncing");
    try {
      const result = await syncPendingSales();
      setSyncStatus(result.failed > 0 ? "error" : "synced");
      await refreshPending();
      window.dispatchEvent(new CustomEvent("zsm-sync-complete", { detail: result }));
      window.setTimeout(() => setSyncStatus("idle"), 4000);
    } catch {
      setSyncStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, [refreshPending]);

  useEffect(() => {
    refreshPending();
    const interval = window.setInterval(refreshPending, 5000);
    const queuedHandler = () => refreshPending();
    window.addEventListener("zsm-offline-sale-queued", queuedHandler);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("zsm-offline-sale-queued", queuedHandler);
    };
  }, [refreshPending]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) runSync();
  }, [isOnline, pendingCount, runSync]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_SALES") runSync();
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [runSync]);

  return { isOnline, pendingCount, syncStatus, refreshPending, runSync };
}
