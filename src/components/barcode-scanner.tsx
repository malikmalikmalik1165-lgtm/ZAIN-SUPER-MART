"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CameraScanner } from "@/components/camera-scanner";
import { Barcode, Search, Plus, AlertCircle, Loader2 } from "@/components/icons";
import type { Product } from "@/lib/types/database";
import { findProductByBarcode, type OfflineProduct } from "@/lib/offline/db";

function offlineToProduct(product: OfflineProduct): Product {
  return {
    ...product,
    unit: product.unit as Product["unit"],
    created_at: "",
    updated_at: "",
    category: null,
  };
}

interface BarcodeScannerProps {
  onProductFound: (product: Product) => void;
  onCreateProduct: (barcode: string) => void;
}

export function BarcodeScanner({ onProductFound, onCreateProduct }: BarcodeScannerProps) {
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookupBarcode = useCallback(async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;
    setScanning(true);
    setNotFound(null);
    setError(null);

    try {
      if (!navigator.onLine) {
        const cached = await findProductByBarcode(clean);
        if (cached?.is_active) {
          onProductFound(offlineToProduct(cached));
          setScanInput("");
        } else {
          setError("Product unavailable offline. Reconnect or enter product details when online.");
          setNotFound(clean);
        }
        return;
      }

      const res = await fetch(`/api/barcode/lookup?barcode=${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lookup failed");

      if (json.found && json.source === "zsm" && json.data) {
        if (!json.data.is_active) { setError(`${json.data.name} is inactive`); return; }
        onProductFound(json.data);
        setScanInput("");
      } else {
        setNotFound(clean);
      }
    } catch {
      // Last-chance local lookup if the request failed during a connection change.
      const cached = await findProductByBarcode(clean).catch(() => undefined);
      if (cached?.is_active) {
        onProductFound(offlineToProduct(cached));
        setScanInput("");
      } else {
        setError("Product lookup failed. Manual entry remains available.");
        setNotFound(clean);
      }
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  }, [onProductFound]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); lookupBarcode(scanInput); }
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
          <input ref={inputRef} type="text" value={scanInput}
            onChange={(e) => { setScanInput(e.target.value); setNotFound(null); setError(null); }}
            onKeyDown={handleKeyDown} placeholder="Scan or type barcode..."
            className="w-full rounded-lg border-2 border-emerald-300 bg-emerald-50 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" autoComplete="off" />
          {scanning && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />}
        </div>
        <Button variant="secondary" onClick={() => lookupBarcode(scanInput)} disabled={!scanInput.trim() || scanning}><Search className="h-4 w-4" /></Button>
        <Button variant="secondary" onClick={() => setShowCamera(true)}>📷 Scan</Button>
      </div>
      {error && <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}
      {notFound && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">Product not found</p>
          <p className="text-xs text-amber-600 mt-0.5">Barcode: {notFound}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setNotFound(null); setScanInput(""); inputRef.current?.focus(); }}>Try Again</Button>
            <Button size="sm" onClick={() => { onCreateProduct(notFound); setNotFound(null); setScanInput(""); }}><Plus className="h-3.5 w-3.5" /> Add Product</Button>
          </div>
        </div>
      )}
      <CameraScanner isOpen={showCamera} onClose={() => setShowCamera(false)} onScan={(b) => { setScanInput(b); lookupBarcode(b); }} title="POS Scanner" />
    </>
  );
}
