"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Plus, Loader2, Truck, Trash2 } from "@/components/icons";

interface Supplier { id: string; name: string; }
interface Product { id: string; name: string; purchase_price: number; }
interface PurchaseItem { product_id: string; product_name: string; quantity: number; unit_cost: number; }
interface Purchase { id: string; purchase_number: string; total: number; notes: string | null; created_at: string; supplier?: { name: string } | null; }

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, sr, pdr] = await Promise.all([fetch("/api/purchases"), fetch("/api/suppliers"), fetch("/api/products?limit=500")]);
      const [pj, sj, pdj] = await Promise.all([pr.json(), sr.json(), pdr.json()]);
      if (pr.ok) setPurchases(pj.data || []);
      if (sr.ok) setSuppliers(sj.data || []);
      if (pdr.ok) setProducts(pdj.data || []);
    } catch { showToast("error", "Failed"); } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const addItem = () => { if (products.length) setItems([...items, { product_id: products[0].id, product_name: products[0].name, quantity: 1, unit_cost: products[0].purchase_price }]); };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!items.length) { showToast("error", "Add items"); return; } setSaving(true);
    try {
      const r = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supplier_id: supplierId || null, items, notes }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      showToast("success", "Purchase recorded & stock updated"); setShowModal(false); setItems([]); setSupplierId(""); setNotes(""); load();
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Purchases</h1><p className="mt-1 text-sm text-slate-500">Record purchases & increase stock</p></div>
        <Button onClick={() => { setItems([]); setSupplierId(""); setNotes(""); setShowModal(true); }}><Plus className="h-4 w-4" />New Purchase</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : purchases.length === 0 ? <EmptyState icon={<Truck className="h-6 w-6 text-slate-400" />} title="No purchases yet" />
        : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-slate-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Purchase #</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Supplier</th><th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Total</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Date</th></tr></thead>
          <tbody className="divide-y">{purchases.map(p => <tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-sm">{p.purchase_number}</td><td className="px-4 py-3 text-sm text-slate-500">{p.supplier?.name || "—"}</td><td className="px-4 py-3 text-right font-semibold">{fmt(p.total)}</td><td className="px-4 py-3 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Purchase" size="lg">
        <form onSubmit={save} className="space-y-4">
          <Select label="Supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)} options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="Select supplier (optional)" />
          <div><div className="flex justify-between items-center mb-2"><label className="text-sm font-medium text-slate-700">Items</label><Button type="button" variant="secondary" size="sm" onClick={addItem}><Plus className="h-3 w-3" />Add Item</Button></div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <div className="flex-1"><select value={item.product_id} onChange={e => { const p = products.find(pr => pr.id === e.target.value); setItems(items.map((it, idx) => idx === i ? { ...it, product_id: e.target.value, product_name: p?.name || "", unit_cost: p?.purchase_price || 0 } : it)); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <Input className="w-20" type="number" min="1" value={item.quantity} onChange={e => setItems(items.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))} />
                <Input className="w-24" type="number" min="0" step="0.01" value={item.unit_cost} onChange={e => setItems(items.map((it, idx) => idx === i ? { ...it, unit_cost: parseFloat(e.target.value) || 0 } : it))} />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
          </div>
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          <div className="flex justify-between items-center pt-2 border-t"><span className="text-lg font-bold">Total: {fmt(total)}</span><div className="flex gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" loading={saving} disabled={!items.length}>Save Purchase</Button></div></div>
        </form>
      </Modal>
    </div>
  );
}
