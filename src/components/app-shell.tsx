"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { preCacheData } from "@/lib/offline/cache-manager";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pre-cache data for offline use when app loads
  useEffect(() => {
    // Initial cache after a short delay
    const timer = setTimeout(() => {
      preCacheData();
    }, 3000);

    // Refresh cache every 10 minutes while online
    const interval = setInterval(() => {
      if (navigator.onLine) preCacheData();
    }, 10 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
