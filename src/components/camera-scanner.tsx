"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "@/components/icons";

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

const SCANNER_ID = "zsm-barcode-reader";

export function CameraScanner({ isOpen, onClose, onScan, title = "Scan Barcode" }: CameraScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const scannerInstanceRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const isStoppingRef = useRef(false);

  // Safe stop function
  const safeStop = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scannerInstanceRef.current) {
        try { await scannerInstanceRef.current.stop(); } catch { /* may already be stopped */ }
        try { scannerInstanceRef.current.clear(); } catch { /* ignore */ }
        scannerInstanceRef.current = null;
      }
    } catch { /* ignore */ }
    isStoppingRef.current = false;
    setReady(false);
    setStarting(false);
  };

  // Start scanner when modal opens
  useEffect(() => {
    if (!isOpen) {
      safeStop();
      setError(null);
      return;
    }

    let cancelled = false;

    const init = async () => {
      // Wait for DOM to be ready
      await new Promise(r => setTimeout(r, 600));
      if (cancelled) return;

      const container = document.getElementById(SCANNER_ID);
      if (!container) {
        setError("Scanner container not available. Try again.");
        return;
      }

      setStarting(true);
      setError(null);

      try {
        // Dynamic import — only loads on client
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        // Ensure no previous instance
        await safeStop();
        if (cancelled) return;

        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const size = Math.min(viewfinderWidth, viewfinderHeight);
              return { width: Math.floor(size * 0.7), height: Math.floor(size * 0.45) };
            },
          },
          (decodedText: string) => {
            if (!cancelled) {
              onScan(decodedText);
              safeStop();
              onClose();
            }
          },
          () => { /* scan attempt — no match yet */ }
        );

        if (!cancelled) {
          setStarting(false);
          setReady(true);
        }
      } catch (err) {
        if (cancelled) return;
        setStarting(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowed") || msg.includes("Permission") || msg.includes("denied")) {
          setError("Camera permission denied. Please allow camera access in your browser settings and try again.");
        } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
          setError("No camera found on this device.");
        } else if (msg.includes("NotReadableError") || msg.includes("in use")) {
          setError("Camera is being used by another app. Close other camera apps and try again.");
        } else {
          setError(`Camera error: ${msg.substring(0, 80)}`);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      safeStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    safeStop();
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input") as HTMLInputElement;
    const val = input?.value?.trim();
    if (val) {
      onScan(val);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={handleClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {error ? (
            <>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  placeholder="Type barcode and press Enter..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
              </form>
              <Button variant="secondary" className="w-full" onClick={() => { setError(null); }}>
                Try Camera Again
              </Button>
            </>
          ) : (
            <>
              {/* Scanner container — MUST have dimensions before html5-qrcode init */}
              <div
                id={SCANNER_ID}
                className="relative w-full overflow-hidden rounded-lg bg-black"
                style={{ minHeight: "250px", aspectRatio: "4/3" }}
              >
                {starting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <p className="text-xs text-white/80">Starting camera...</p>
                  </div>
                )}
              </div>

              {ready && (
                <p className="text-xs text-emerald-600 text-center font-medium">
                  ✓ Camera active — point at barcode
                </p>
              )}

              <p className="text-xs text-slate-500 text-center">
                Supports EAN-13, EAN-8, UPC-A, Code 128, QR
              </p>

              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  placeholder="Or type barcode here and press Enter..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-center focus:border-emerald-500 focus:outline-none"
                />
              </form>
            </>
          )}

          <Button variant="secondary" className="w-full" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
