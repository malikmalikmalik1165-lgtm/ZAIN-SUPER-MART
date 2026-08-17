"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Loader2,
  Check,
  AlertCircle,
  FileText,
  X,
} from "@/components/icons";
import * as XLSX from "xlsx";

interface ImportRow {
  name: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchase_price?: number;
  sale_price?: number;
  stock_quantity?: number;
  minimum_stock?: number;
}

interface ImportResult {
  row: number;
  name: string;
  status: "success" | "error";
  error?: string;
}

interface ExcelImportProps {
  onComplete: () => void;
}

export function ExcelImport({ onComplete }: ExcelImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [validRows, setValidRows] = useState(0);
  const [errorRows, setErrorRows] = useState<{ row: number; error: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [generateBarcodes, setGenerateBarcodes] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        const parsed: ImportRow[] = [];
        const errors: { row: number; error: string }[] = [];
        let valid = 0;

        for (let i = 0; i < data.length; i++) {
          const r = data[i];
          const name = String(r["name"] || r["Name"] || r["product_name"] || r["Product Name"] || r["product"] || r["Product"] || "").trim();

          if (!name) {
            errors.push({ row: i + 2, error: "Product name missing" });
            parsed.push({ name: "" });
            continue;
          }

          const row: ImportRow = {
            name,
            barcode: String(r["barcode"] || r["Barcode"] || r["code"] || r["Code"] || "").trim() || undefined,
            category: String(r["category"] || r["Category"] || "").trim() || undefined,
            unit: String(r["unit"] || r["Unit"] || "piece").trim(),
            purchase_price: parseFloat(String(r["purchase_price"] || r["Purchase Price"] || r["cost"] || r["Cost"] || 0)),
            sale_price: parseFloat(String(r["sale_price"] || r["Sale Price"] || r["price"] || r["Price"] || 0)),
            stock_quantity: parseInt(String(r["stock_quantity"] || r["Stock"] || r["stock"] || r["quantity"] || r["Quantity"] || 0)),
            minimum_stock: parseInt(String(r["minimum_stock"] || r["Min Stock"] || r["min_stock"] || 0)),
          };

          if (isNaN(row.sale_price!) || row.sale_price! < 0) {
            errors.push({ row: i + 2, error: "Invalid sale price" });
          } else if (isNaN(row.stock_quantity!) || row.stock_quantity! < 0) {
            errors.push({ row: i + 2, error: "Invalid stock quantity" });
          } else {
            valid++;
          }

          parsed.push(row);
        }

        setRows(parsed);
        setValidRows(valid);
        setErrorRows(errors);
      } catch {
        showToast("error", "Failed to read Excel file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validImportRows = rows.filter((r) => r.name && r.name.trim().length > 0);
    if (validImportRows.length === 0) {
      showToast("error", "No valid rows to import");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validImportRows, generateMissingBarcodes: generateBarcodes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setResults(json.data.results);
      showToast("success", `Imported ${json.data.success} of ${json.data.total} products`);
      if (json.data.success > 0) onComplete();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setRows([]);
    setFileName("");
    setValidRows(0);
    setErrorRows([]);
    setResults(null);
    setGenerateBarcodes(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <Button variant="secondary" onClick={() => { reset(); setIsOpen(true); }}>
        <FileText className="h-4 w-4" />
        Import Excel
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Import Products from Excel" size="xl">
        <div className="space-y-4">
          {!results ? (
            <>
              {/* File Selection */}
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileText className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 mb-2">
                  {fileName || "Select Excel file (.xlsx or .xls)"}
                </p>
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  Choose File
                </Button>
              </div>

              {/* Preview */}
              {rows.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-2xl font-bold text-slate-800">{rows.length}</p>
                      <p className="text-xs text-slate-500">Total Rows</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="text-2xl font-bold text-emerald-700">{validRows}</p>
                      <p className="text-xs text-emerald-600">Valid</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3">
                      <p className="text-2xl font-bold text-red-700">{errorRows.length}</p>
                      <p className="text-xs text-red-600">Errors</p>
                    </div>
                  </div>

                  {errorRows.length > 0 && (
                    <div className="max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">Issues:</p>
                      {errorRows.slice(0, 10).map((e) => (
                        <p key={e.row} className="text-xs text-red-600">Row {e.row}: {e.error}</p>
                      ))}
                      {errorRows.length > 10 && (
                        <p className="text-xs text-red-500 mt-1">...and {errorRows.length - 10} more</p>
                      )}
                    </div>
                  )}

                  {/* Preview table */}
                  <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left">#</th>
                          <th className="px-2 py-1.5 text-left">Name</th>
                          <th className="px-2 py-1.5 text-left">Barcode</th>
                          <th className="px-2 py-1.5 text-right">Price</th>
                          <th className="px-2 py-1.5 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 20).map((r, i) => (
                          <tr key={i} className={`border-t ${!r.name ? "bg-red-50" : ""}`}>
                            <td className="px-2 py-1">{i + 1}</td>
                            <td className="px-2 py-1">{r.name || "—"}</td>
                            <td className="px-2 py-1 text-slate-500">{r.barcode || "—"}</td>
                            <td className="px-2 py-1 text-right">{r.sale_price || 0}</td>
                            <td className="px-2 py-1 text-right">{r.stock_quantity || 0}</td>
                          </tr>
                        ))}
                        {rows.length > 20 && (
                          <tr><td colSpan={5} className="px-2 py-1 text-center text-slate-400">...{rows.length - 20} more rows</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Options */}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={generateBarcodes}
                      onChange={(e) => setGenerateBarcodes(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    Generate barcodes for products without barcodes
                  </label>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleImport} loading={importing} disabled={validRows === 0}>
                      Import {validRows} Products
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Results */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-2xl font-bold text-emerald-700">{results.filter((r) => r.status === "success").length}</p>
                  <p className="text-xs text-emerald-600">Imported</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-2xl font-bold text-red-700">{results.filter((r) => r.status === "error").length}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {results.map((r) => (
                  <div key={r.row} className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs ${r.status === "success" ? "bg-emerald-50" : "bg-red-50"}`}>
                    {r.status === "success" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                    <span className="text-slate-500">#{r.row}</span>
                    <span className="font-medium">{r.name}</span>
                    {r.error && <span className="text-red-600 ml-auto">{r.error}</span>}
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={() => { setIsOpen(false); reset(); }}>
                Done
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
