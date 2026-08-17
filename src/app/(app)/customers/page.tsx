"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, Pencil, Loader2, UserCheck, Banknote } from "@/components/icons";

interface Customer { id: string; name: string; phone: string | null; address: string | null; balance: number; is_active: boolean; created_at: string; transactions?: { id: string; type: string; amount: number; note: string | null; created_at: string }[]; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [payAmount, setPayAmount] = useState(0);
  const [payNote, setPayNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const j = await r.json();
      if (r.ok) setCustomers(j.data || []);
    } catch { showToast("error", "Failed to load"); }
    finally { setLoading(false); }
  }, [search, showToast]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openCreate = () => { setEditing(null); setForm({ name: "", phone: "", address: "" }); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({ name: c.name, phone: c.phone || "", address: c.address || "" }); setShowModal(true); };
  const openDetail = async (c: Customer) => {
    try {
      const r = await fetch(`/api/customers/${c.id}`);
      const j = await r.json();
      if (r.ok) { setSelected(j.data); setShowDetail(true); }
    } catch { showToast("error", "Failed to load"); }
  };
  const openPayment = (c: Customer) => { setSelected(c); setPayAmount(0); setPayNote(""); setShowPayment(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
      const r = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      showToast("success", editing ? "Updated" : "Created");
      setShowModal(false); fetch_();
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    try {
      const r = await fetch(`/api/customers/${selected.id}/payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: payAmount, note: payNote }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      showToast("success", `Rs. ${payAmount} payment recorded`);
      setShowPayment(false); fetch_();
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Customers</h1><p className="mt-1 text-sm text-slate-500">Manage customers & credit</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />Add Customer</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : customers.length === 0 ? <EmptyState icon={<UserCheck className="h-6 w-6 text-slate-400" />} title="No customers" action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" />Add</Button>} />
        : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-slate-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Name</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Phone</th><th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Balance</th><th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Actions</th></tr></thead>
          <tbody className="divide-y">{customers.map(c => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3"><button onClick={() => openDetail(c)} className="font-medium text-emerald-700 hover:underline">{c.name}</button></td>
              <td className="px-4 py-3 text-sm text-slate-500">{c.phone || "—"}</td>
              <td className="px-4 py-3 text-right"><span className={`font-semibold ${c.balance > 0 ? "text-red-600" : "text-slate-800"}`}>{fmt(c.balance)}</span></td>
              <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1">
                {c.balance > 0 && <Button variant="ghost" size="sm" onClick={() => openPayment(c)} title="Record Payment"><Banknote className="h-4 w-4 text-emerald-500" /></Button>}
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
              </div></td>
            </tr>
          ))}</tbody></table></div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Customer" : "Add Customer"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" loading={saving}>{editing ? "Update" : "Create"}</Button></div>
        </form>
      </Modal>

      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        {selected && <form onSubmit={handlePayment} className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3"><p className="font-medium">{selected.name}</p><p className="text-sm text-red-600">Outstanding: {fmt(selected.balance)}</p></div>
          <Input label="Amount (Rs.)" type="number" min="1" max={selected.balance} value={payAmount} onChange={e => setPayAmount(parseFloat(e.target.value) || 0)} required />
          <Input label="Note" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Optional" />
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowPayment(false)}>Cancel</Button><Button type="submit" loading={saving}>Record Payment</Button></div>
        </form>}
      </Modal>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Customer Details" size="lg">
        {selected && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Name</p><p className="font-medium">{selected.name}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Phone</p><p className="font-medium">{selected.phone || "—"}</p></div></div>
          <div className="rounded-lg bg-red-50 p-3 text-center"><p className="text-sm text-red-600">Outstanding Balance</p><p className="text-2xl font-bold text-red-700">{fmt(selected.balance)}</p></div>
          {selected.transactions && selected.transactions.length > 0 && <div><h4 className="text-sm font-semibold mb-2">Transaction History</h4><div className="max-h-48 overflow-y-auto space-y-1">{selected.transactions.map(tx => (
            <div key={tx.id} className={`flex justify-between rounded px-3 py-2 text-sm ${tx.type === "credit" ? "bg-red-50" : "bg-emerald-50"}`}>
              <div><span className={`font-medium ${tx.type === "credit" ? "text-red-700" : "text-emerald-700"}`}>{tx.type === "credit" ? "Credit" : "Payment"}</span>{tx.note && <span className="text-slate-500 ml-2">{tx.note}</span>}</div>
              <span className={`font-semibold ${tx.type === "credit" ? "text-red-600" : "text-emerald-600"}`}>{tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}</span>
            </div>
          ))}</div></div>}
        </div>}
      </Modal>
    </div>
  );
}
