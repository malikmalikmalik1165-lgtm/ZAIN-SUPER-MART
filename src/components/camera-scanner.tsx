"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "@/components/icons";

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export function CameraScanner({ isOpen, onClose, onScan, title = "Scan Barcode" }: CameraScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    try {
      const s = scannerRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
      if (s?.stop) await s.stop();
      if (s?.clear) s.clear();
    } catch { /* ignore */ }
    scannerRef.current = null;
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current) return;
    setError(null);
    setStarting(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const id = "zsm-scanner-" + Date.now();
      if (containerRef.current) containerRef.current.id = id;

      const scanner = new Html5Qrcode(id);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 },
        (text: string) => {
          if (mountedRef.current) {
            onScan(text);
            stopScanner();
            onClose();
          }
        },
        () => { /* scanning... */ }
      );
      if (mountedRef.current) setStarting(false);
    } catch (err) {
      if (mountedRef.current) {
        setStarting(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowed") || msg.includes("Permission")) {
          setError("Camera permission denied. Allow camera access and try again.");
        } else if (msg.includes("NotFound")) {
          setError("No camera found on this device.");
        } else {
          setError("Camera unavailable. Enter barcode manually.");
        }
      }
    }
  }, [onScan, onClose, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    if (isOpen) {
      const t = setTimeout(startScanner, 400);
      return () => { clearTimeout(t); };
    } else {
      stopScanner();
    }
    return () => { mountedRef.current = false; };
  }, [isOpen, startScanner, stopScanner]);

  useEffect(() => () => { mountedRef.current = false; stopScanner(); }, [stopScanner]);

  const handleManual = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const v = (e.target as HTMLInputElement).value.trim();
      if (v) { onScan(v); onClose(); }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { stopScanner(); onClose(); }} title={title} size="md">
      <div className="space-y-4">
        {error ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">{error}</div>
            <input type="text" placeholder="Type barcode and press Enter..." className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-sm" onKeyDown={handleManual} autoFocus />
          </div>
        ) : (
          <>
            <div ref={containerRef} className="relative aspect-[3/2] overflow-hidden rounded-lg bg-black">
              {starting && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}
            </div>
            <p className="text-xs text-slate-500 text-center">Point camera at barcode (EAN-13, UPC-A, Code 128, QR)</p>
            <input type="text" placeholder="Or type barcode here..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-center" onKeyDown={handleManual} />
          </>
        )}
        <Button variant="secondary" className="w-full" onClick={() => { stopScanner(); onClose(); }}>Cancel</Button>
      </div>
    </Modal>
  );
}
