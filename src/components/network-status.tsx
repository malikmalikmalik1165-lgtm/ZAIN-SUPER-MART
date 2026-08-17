"use client";

import { useOffline } from "@/lib/hooks/use-offline";
import { Wifi, WifiOff, RefreshCw } from "@/components/icons";

export function NetworkStatus() {
  const { isOnline, pendingCount, syncStatus } = useOffline();

  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${isOnline ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
        {isOnline ? <><Wifi className="h-3.5 w-3.5" /><span>Online</span></> : <><WifiOff className="h-3.5 w-3.5" /><span>Offline</span></>}
        {syncStatus === "syncing" && <RefreshCw className="h-3 w-3 animate-spin ml-auto" />}
      </div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700">
          <span>⏳ {pendingCount} pending sync</span>
        </div>
      )}
    </div>
  );
}
