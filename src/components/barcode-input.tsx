"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarcodeDisplay } from "@/components/barcode-display";
import { CameraScanner } from "@/components/camera-scanner";
import { Barcode } from "@/components/icons";

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  generating?: boolean;
  error?: string;
}

export function BarcodeInput({ value, onChange, onGenerate, generating, error }: BarcodeInputProps) {
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Barcode</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Scan, type, or generate"
            className={`w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ${error ? "border-red-300 focus:ring-red-500/20" : "border-slate-300 focus:ring-emerald-500/20"}`} />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowCamera(true)}>📷 Scan</Button>
        {onGenerate && <Button type="button" variant="secondary" size="sm" loading={generating} onClick={onGenerate}>Generate</Button>}
        {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>✕</Button>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {value && <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-2"><BarcodeDisplay value={value} height={40} width={1.5} /></div>}
      <p className="text-xs text-slate-500">Scan with camera/hardware scanner, type manually, or generate internal barcode</p>
      <CameraScanner isOpen={showCamera} onClose={() => setShowCamera(false)} onScan={(b) => onChange(b)} title="Scan Product Barcode" />
    </div>
  );
}
