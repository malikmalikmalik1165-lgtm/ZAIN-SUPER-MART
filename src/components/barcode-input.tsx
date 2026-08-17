"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BarcodeDisplay } from "@/components/barcode-display";
import { CameraScanner } from "@/components/camera-scanner";
import { Barcode, Loader2, Check, AlertCircle } from "@/components/icons";

interface ExternalProductInfo {
  name: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  pack_size: string | null;
  source: string;
}

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  generating?: boolean;
  error?: string;
  onExternalProductFound?: (info: ExternalProductInfo) => void;
  onExistingProduct?: (message: string) => void;
}

export function BarcodeInput({ value, onChange, onGenerate, generating, error, onExternalProductFound, onExistingProduct }: BarcodeInputProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "searching" | "found" | "external" | "not-found">("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [externalImage, setExternalImage] = useState<string | null>(null);

  const performLookup = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setLookupStatus("searching");
    setLookupMessage("Searching product information...");
    setExternalImage(null);

    try {
      const res = await fetch(`/api/barcode/lookup?barcode=${encodeURIComponent(barcode.trim())}`);
      const json = await res.json();

      if (json.found && json.source === "zsm") {
        setLookupStatus("found");
        setLookupMessage(`Product already exists: ${json.data.name}`);
        onExistingProduct?.(`Product already exists in ZSM: ${json.data.name}`);
      } else if (json.found && json.source === "external") {
        setLookupStatus("external");
        const ext = json.external as ExternalProductInfo;
        setLookupMessage(`✓ Found: ${ext.name || "Unknown"} (${ext.source})`);
        if (ext.image_url) setExternalImage(ext.image_url);
        onExternalProductFound?.(ext);
      } else {
        setLookupStatus("not-found");
        setLookupMessage("Product not found externally. Enter details manually.");
      }
    } catch {
      setLookupStatus("not-found");
      setLookupMessage("Lookup failed. Enter details manually.");
    }
  }, [onExternalProductFound, onExistingProduct]);

  const handleScan = (barcode: string) => {
    onChange(barcode);
    performLookup(barcode);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Barcode</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={value}
            onChange={(e) => { onChange(e.target.value); setLookupStatus("idle"); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); performLookup(value); } }}
            placeholder="Scan, type barcode + Enter, or generate"
            className={`w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ${error ? "border-red-300 focus:ring-red-500/20" : "border-slate-300 focus:ring-emerald-500/20"}`} />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowCamera(true)}>📷 Scan</Button>
        {onGenerate && <Button type="button" variant="secondary" size="sm" loading={generating} onClick={onGenerate}>Generate</Button>}
        {value && <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(""); setLookupStatus("idle"); setExternalImage(null); }}>✕</Button>}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Lookup Status */}
      {lookupStatus === "searching" && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />{lookupMessage}
        </div>
      )}
      {lookupStatus === "found" && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4" />{lookupMessage}
        </div>
      )}
      {lookupStatus === "external" && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Check className="h-4 w-4" />{lookupMessage}
          </div>
          {externalImage && (
            <div className="mt-2 flex justify-center">
              <img src={externalImage} alt="Product" className="h-20 w-20 rounded-lg object-contain border bg-white" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </div>
      )}
      {lookupStatus === "not-found" && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <AlertCircle className="h-4 w-4" />{lookupMessage}
        </div>
      )}

      {/* Barcode Preview */}
      {value && (
        <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-2">
          <BarcodeDisplay value={value} height={40} width={1.5} />
        </div>
      )}

      <p className="text-xs text-slate-500">Scan with camera, type + Enter for auto-lookup, or generate internal barcode</p>

      <CameraScanner isOpen={showCamera} onClose={() => setShowCamera(false)} onScan={handleScan} title="Scan Product Barcode" />
    </div>
  );
}
