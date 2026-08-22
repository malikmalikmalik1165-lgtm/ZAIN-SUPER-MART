"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { preCacheData } from "@/lib/offline/cache-manager";

interface AppShellProps {
  children: ReactNode;
}

const OFFLINE_READY_ROUTES = [
  "/dashboard",
  "/pos",
  "/products",
  "/categories",
  "/inventory",
  "/customers",
  "/suppliers",
  "/purchases",
  "/expenses",
  "/reports",
  "/settings",
];

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const warmOfflineApp = async () => {
      if (!navigator.onLine) return;

      // Ask Next to load route payloads/chunks; SW captures them as they load.
      OFFLINE_READY_ROUTES.forEach((route) => router.prefetch(route));

      try {
        await preCacheData();
      } catch (error) {
        console.warn("[ZSM Offline] Warm-up failed:", error);
      }
    };

    const timer = window.setTimeout(warmOfflineApp, 2000);
    const interval = window.setInterval(() => {
      if (navigator.onLine) preCacheData().catch(() => undefined);
    }, 10 * 60 * 1000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [router]);

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
