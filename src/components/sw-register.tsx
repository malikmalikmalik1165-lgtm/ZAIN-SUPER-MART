"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates every 5 minutes
        setInterval(() => registration.update(), 5 * 60 * 1000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("SW registration failed:", err);
      });

    // Listen for controller change (after skipWaiting)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] mx-auto max-w-sm">
      <div className="flex items-center gap-3 rounded-xl bg-blue-600 p-4 text-white shadow-lg">
        <div className="flex-1">
          <p className="text-sm font-semibold">🔄 Update Available</p>
          <p className="text-xs text-blue-100">New version of ZSM is ready</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white text-blue-700 hover:bg-blue-50"
          onClick={() => {
            navigator.serviceWorker.ready.then((reg) => {
              reg.waiting?.postMessage("SKIP_WAITING");
            });
          }}
        >
          Update
        </Button>
      </div>
    </div>
  );
}
