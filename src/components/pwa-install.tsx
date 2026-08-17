"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    const d = localStorage.getItem("zsm_pwa_dismissed");
    if (d && Date.now() - parseInt(d) < 86400000) setDismissed(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="flex items-center gap-3 rounded-xl bg-emerald-600 p-4 text-white shadow-lg shadow-emerald-600/30">
        <div className="flex-1">
          <p className="text-sm font-semibold">Install ZAIN SUPER MART</p>
          <p className="text-xs text-emerald-100">Quick access from home screen</p>
        </div>
        <Button variant="secondary" size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50"
          onClick={async () => { await prompt.prompt(); const c = await prompt.userChoice; if (c.outcome === "accepted") setPrompt(null); }}>
          Install
        </Button>
        <button onClick={() => { setDismissed(true); localStorage.setItem("zsm_pwa_dismissed", String(Date.now())); }} className="text-emerald-200 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
