"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, Pencil, Loader2, Truck } from "@/components/icons";

interface Supplier { id: string; name: string; phone: string | null; address: string | null; is_active: boolean; }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`); const j = await r.json(); if (r.ok) setSuppliers(j.data || []); }
    catch { showToast("error", "Failed"); } finally { setLoading(false); }
  }, [search, showToast]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editing ? `/api/suppliers` : "/api/suppliers";
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      showToast("success", "Saved"); setShowModal(false); load();
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Suppliers</h1><p className="mt-1 text-sm text-slate-500">Manage suppliers</p></div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", phone: "", address: "" }); setShowModal(true); }}><Plus className="h-4 w-4" />Add Supplier</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : suppliers.length === 0 ? <EmptyState icon={<Truck className="h-6 w-6 text-slate-400" />} title="No suppliers" />
        : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-slate-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Name</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Phone</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Address</th></tr></thead>
          <tbody className="divide-y">{suppliers.map(s => <tr key={s.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium">{s.name}</td><td className="px-4 py-3 text-sm text-slate-500">{s.phone || "—"}</td><td className="px-4 py-3 text-sm text-slate-500">{s.address || "—"}</td></tr>)}</tbody></table></div>}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Supplier">
        <form onSubmit={save} className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" loading={saving}>Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}
