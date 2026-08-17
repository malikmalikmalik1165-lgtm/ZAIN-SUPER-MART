"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Bottom banner prompt (auto-shows when browser supports install)
export function PwaInstallBanner() {
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
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3 rounded-xl bg-emerald-600 p-4 text-white shadow-lg">
        <div className="flex-1">
          <p className="text-sm font-semibold">📱 Install ZAIN SUPER MART</p>
          <p className="text-xs text-emerald-100">Add to home screen for quick access</p>
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

// Sidebar install button (always visible with instructions)
export function PwaInstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) {
    return (
      <div className="rounded-lg bg-emerald-900/50 px-3 py-2 text-center">
        <p className="text-[10px] text-emerald-400">✅ App Installed</p>
      </div>
    );
  }

  const handleInstall = async () => {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setPrompt(null);
      }
    } else {
      setShowHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstall}
        className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 transition-colors"
      >
        {prompt ? "📱 Install App" : "📱 Install ZAIN SUPER MART"}
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-3">📱 Install ZAIN SUPER MART</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="font-semibold text-blue-800 mb-1">Chrome / Edge (Android & Laptop)</p>
                <ol className="list-decimal pl-4 space-y-1 text-blue-700">
                  <li>Tap the <b>⋮</b> menu (3 dots) in browser</li>
                  <li>Tap <b>&quot;Install App&quot;</b> or <b>&quot;Add to Home Screen&quot;</b></li>
                  <li>Confirm installation</li>
                </ol>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800 mb-1">iPhone / iPad (Safari)</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Tap the <b>Share</b> button (square with arrow)</li>
                  <li>Scroll down and tap <b>&quot;Add to Home Screen&quot;</b></li>
                  <li>Tap <b>&quot;Add&quot;</b></li>
                </ol>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="font-semibold text-emerald-800 mb-1">Windows (Chrome/Edge)</p>
                <ol className="list-decimal pl-4 space-y-1 text-emerald-700">
                  <li>Click the <b>install icon</b> (⊕) in the address bar</li>
                  <li>Or click <b>⋮ Menu → Install ZAIN SUPER MART</b></li>
                </ol>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={() => setShowHelp(false)}>Got it</Button>
          </div>
        </div>
      )}
    </>
  );
}
