"use client";

import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { Wifi, WifiOff, Activity, RefreshCw, CircleCheck } from "@/components/icons";

export function SystemStatus() {
  const isOnline = useNetworkStatus();

  const statuses = [
    {
      label: "Connection",
      value: isOnline ? "Connected" : "Offline",
      icon: isOnline ? (
        <Wifi className="h-4 w-4 text-emerald-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      ),
      color: isOnline ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Application",
      value: "Running",
      icon: <Activity className="h-4 w-4 text-emerald-600" />,
      color: "text-emerald-600",
    },
    {
      label: "Sync Status",
      value: "Not configured",
      icon: <RefreshCw className="h-4 w-4 text-slate-400" />,
      color: "text-slate-400",
      note: "Phase 2+",
    },
    {
      label: "Database",
      value: isOnline ? "Available" : "Offline mode",
      icon: <CircleCheck className="h-4 w-4 text-emerald-600" />,
      color: isOnline ? "text-emerald-600" : "text-amber-500",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">
        System Status
      </h3>
      <div className="space-y-3">
        {statuses.map((status) => (
          <div
            key={status.label}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              {status.icon}
              <span className="text-sm text-slate-600">{status.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${status.color}`}>
                {status.value}
              </span>
              {status.note && (
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {status.note}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
