"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __zsmInstallPrompt?: BeforeInstallPromptEvent | null;
    __zsmAppInstalled?: boolean;
  }
}

type InstallState = "checking" | "ready" | "installing" | "installed" | "unavailable";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.__zsmAppInstalled === true ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function useNativeInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallState>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = () => {
      if (isStandalone()) {
        setState("installed");
        setPrompt(null);
        return;
      }
      const captured = window.__zsmInstallPrompt ?? null;
      setPrompt(captured);
      setState(captured ? "ready" : "unavailable");
    };

    const installed = () => {
      setState("installed");
      setPrompt(null);
      setMessage("ZAIN SUPER MART installed successfully.");
    };

    window.addEventListener("zsm-install-ready", refresh);
    window.addEventListener("zsm-app-installed", installed);
    window.addEventListener("beforeinstallprompt", refresh);
    window.addEventListener("appinstalled", installed);

    const frame = requestAnimationFrame(refresh);
    // Chromium may emit installability after service-worker control is established.
    const retry = window.setTimeout(refresh, 1500);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      window.removeEventListener("zsm-install-ready", refresh);
      window.removeEventListener("zsm-app-installed", installed);
      window.removeEventListener("beforeinstallprompt", refresh);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const install = useCallback(async () => {
    if (isStandalone()) {
      setState("installed");
      setMessage("ZAIN SUPER MART is already installed.");
      return;
    }

    const activePrompt = prompt ?? window.__zsmInstallPrompt ?? null;
    if (!activePrompt) {
      setState("unavailable");
      setMessage(
        /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? "iPhone Safari does not allow one-tap web app installation. Use Safari Share → Add to Home Screen."
          : "Native install is not available yet. Open this HTTPS site in Chrome or Edge and try again after the page finishes loading."
      );
      return;
    }

    setState("installing");
    setMessage("");
    try {
      // Must run directly from this user click; browser shows its mandatory confirmation.
      await activePrompt.prompt();
      const choice = await activePrompt.userChoice;
      window.__zsmInstallPrompt = null;
      setPrompt(null);
      if (choice.outcome === "accepted") {
        setState("installed");
        setMessage("Installation accepted. ZSM will open as an app.");
      } else {
        setState("unavailable");
        setMessage("Installation was cancelled. Tap Install App to try again when Chrome/Edge offers it.");
      }
    } catch {
      setState("unavailable");
      setMessage("The browser could not start installation. Confirm you are using HTTPS in Chrome or Edge.");
    }
  }, [prompt]);

  return { state, message, install };
}

export function PwaInstallBanner() {
  const { state, install } = useNativeInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem("zsm_pwa_dismissed");
    const frame = requestAnimationFrame(() => {
      if (dismissedAt && Date.now() - Number(dismissedAt) < 86400000) setDismissed(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (state !== "ready" || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="flex items-center gap-3 rounded-xl bg-emerald-600 p-4 text-white shadow-lg">
        <div className="flex-1">
          <p className="text-sm font-semibold">Install ZAIN SUPER MART</p>
          <p className="text-xs text-emerald-100">Opens as a standalone mobile/laptop app</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white text-emerald-700 hover:bg-emerald-50"
          onClick={install}
        >
          Install
        </Button>
        <button
          aria-label="Dismiss install prompt"
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("zsm_pwa_dismissed", String(Date.now()));
          }}
          className="text-emerald-200 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PwaInstallButton() {
  const { state, message, install } = useNativeInstall();

  if (state === "installed") {
    return (
      <div className="rounded-lg bg-emerald-900/50 px-3 py-2 text-center">
        <p className="text-[11px] font-medium text-emerald-300">App Installed</p>
        {message && <p className="mt-0.5 text-[9px] text-emerald-400">{message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={install}
        disabled={state === "installing"}
        className="w-full rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-70"
      >
        {state === "installing"
          ? "Starting installation..."
          : state === "ready"
            ? "Install App"
            : "Install ZAIN SUPER MART"}
      </button>
      {message && (
        <p className="rounded-md bg-slate-800 px-2 py-1.5 text-[9px] leading-relaxed text-slate-300">
          {message}
        </p>
      )}
      {state === "checking" && (
        <p className="text-center text-[9px] text-slate-500">Checking install availability...</p>
      )}
    </div>
  );
}
