"use client";

import { useOffline } from "@/lib/hooks/use-offline";
import { Wifi, WifiOff, RefreshCw, CircleCheck, CircleAlert } from "@/components/icons";

export function NetworkStatus() {
  const { isOnline, pendingCount, syncStatus, runSync } = useOffline();

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
        isOnline ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}>
        {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        <span>{isOnline ? "Online" : "Offline — sales save locally"}</span>
      </div>

      {syncStatus === "syncing" && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Syncing {pendingCount} sale{pendingCount !== 1 ? "s" : ""}...
        </div>
      )}

      {syncStatus === "synced" && pendingCount === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
          <CircleCheck className="h-3 w-3" />All sales synced
        </div>
      )}

      {syncStatus === "error" && (
        <button onClick={runSync} className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-left text-[11px] font-medium text-red-700">
          <CircleAlert className="h-3 w-3" />Sync failed — tap to retry
        </button>
      )}

      {pendingCount > 0 && syncStatus !== "syncing" && (
        <button
          onClick={() => isOnline && runSync()}
          className="flex w-full items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-left text-[11px] font-medium text-amber-700"
        >
          <span>⏳ Pending Sync: {pendingCount}</span>
          {isOnline && <span className="ml-auto">Retry</span>}
        </button>
      )}
    </div>
  );
}
