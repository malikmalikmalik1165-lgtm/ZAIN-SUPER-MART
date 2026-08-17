"use client";

import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { Wifi, WifiOff } from "@/components/icons";

export function NetworkStatus() {
  const isOnline = useNetworkStatus();

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
        isOnline
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
