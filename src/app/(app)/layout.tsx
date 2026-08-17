"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { PwaInstallBanner } from "@/components/pwa-install";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
      <PwaInstallBanner />
    </ToastProvider>
  );
}
