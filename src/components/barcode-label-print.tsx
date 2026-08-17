"use client";

import { STORE } from "@/lib/constants";
import { BarcodeDisplay } from "@/components/barcode-display";
import { Button } from "@/components/ui/button";
import { Printer } from "@/components/icons";

interface BarcodeLabelPrintProps {
  productName: string;
  barcode: string;
  salePrice?: number;
  onClose?: () => void;
}

export function BarcodeLabelPrint({
  productName,
  barcode,
  salePrice,
  onClose,
}: BarcodeLabelPrintProps) {
  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html><head><title>Label - ${productName}</title>
<style>
@page { size: 50mm 30mm; margin: 0; }
body { font-family: monospace; text-align: center; padding: 4px; margin: 0; width: 50mm; }
.store { font-size: 7px; font-weight: bold; margin-bottom: 2px; }
.name { font-size: 9px; font-weight: bold; margin-bottom: 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.price { font-size: 12px; font-weight: bold; margin-top: 2px; }
.barcode-num { font-size: 8px; color: #666; }
svg { max-width: 100%; }
</style>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
</head><body>
<div class="store">${STORE.name}</div>
<div class="name">${productName}</div>
<svg id="bc"></svg>
<div class="barcode-num">${barcode}</div>
${salePrice !== undefined ? `<div class="price">Rs. ${salePrice}</div>` : ""}
<script>
try { JsBarcode("#bc", "${barcode}", { format: "CODE128", width: 1.5, height: 35, displayValue: false, margin: 2 }); } catch(e) {}
setTimeout(function(){ window.print(); }, 500);
<\/script>
</body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
        <p className="text-[10px] font-bold text-slate-500">{STORE.name}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{productName}</p>
        <div className="mt-2 flex justify-center">
          <BarcodeDisplay value={barcode} width={1.5} height={40} />
        </div>
        {salePrice !== undefined && (
          <p className="mt-1 text-lg font-bold text-emerald-700">Rs. {salePrice}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Close
        </Button>
        <Button className="flex-1" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Print Label
        </Button>
      </div>
    </div>
  );
}
