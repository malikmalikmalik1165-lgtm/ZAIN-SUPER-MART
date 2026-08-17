"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Barcode,
  Search,
  Plus,
  AlertCircle,
  Loader2,
  X,
} from "@/components/icons";
import type { Product } from "@/lib/types/database";

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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Focus scanner input on mount and after each scan
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const lookupBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setScanning(true);
    setNotFound(null);
    setError(null);

    try {
      const res = await fetch(`/api/barcode/lookup?barcode=${encodeURIComponent(barcode.trim())}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Lookup failed");
        return;
      }

      if (json.found && json.data) {
        if (!json.data.is_active) {
          setError(`${json.data.name} is inactive`);
          return;
        }
        onProductFound(json.data);
        setScanInput("");
        setNotFound(null);
      } else {
        setNotFound(barcode.trim());
      }
    } catch {
      setError("Failed to look up barcode");
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  }, [onProductFound]);

  // Handle keyboard/USB scanner input (they send chars + Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupBarcode(scanInput);
    }
  };

  // Camera scanning
  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Camera unavailable. Enter barcode manually.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  return (
    <>
      {/* Scanner Input Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={(e) => { setScanInput(e.target.value); setNotFound(null); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Scan or type barcode..."
            className="w-full rounded-lg border-2 border-emerald-300 bg-emerald-50 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            autoComplete="off"
          />
          {scanning && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
          )}
        </div>
        <Button
          variant="secondary"
          onClick={() => lookupBarcode(scanInput)}
          disabled={!scanInput.trim() || scanning}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          onClick={startCamera}
          title="Scan with camera"
        >
          📷
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Not Found */}
      {notFound && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">Product not found</p>
          <p className="text-xs text-amber-600 mt-0.5">Barcode: {notFound}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setNotFound(null); setScanInput(""); inputRef.current?.focus(); }}>
              Try Again
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setNotFound(null); setScanInput(""); }}>
              <Search className="h-3.5 w-3.5" /> Search
            </Button>
            <Button size="sm" onClick={() => { onCreateProduct(notFound); setNotFound(null); setScanInput(""); }}>
              <Plus className="h-3.5 w-3.5" /> Create Product
            </Button>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      <Modal isOpen={showCamera} onClose={stopCamera} title="Camera Scanner" size="md">
        <div className="space-y-4">
          {cameraError ? (
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-sm text-red-600">{cameraError}</p>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Enter barcode manually..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      lookupBarcode((e.target as HTMLInputElement).value);
                      stopCamera();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-0.5 w-3/4 bg-red-500/60" />
                </div>
              </div>
              <p className="text-center text-xs text-slate-500">
                Point camera at barcode. Auto-detection requires a barcode scanning library.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or type barcode here..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      lookupBarcode((e.target as HTMLInputElement).value);
                      stopCamera();
                    }
                  }}
                />
                <Button variant="secondary" onClick={stopCamera}>Close</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
