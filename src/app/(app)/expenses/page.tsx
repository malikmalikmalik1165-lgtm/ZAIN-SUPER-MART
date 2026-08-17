"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Plus, Loader2, Receipt } from "@/components/icons";

const EXPENSE_CATEGORIES = ["Rent", "Electricity", "Water", "Gas", "Salary", "Transport", "Repair", "Cleaning", "Food", "Packaging", "Other"];
interface Expense { id: string; category: string; amount: number; description: string | null; expense_date: string; created_at: string; }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: "Other", amount: 0, description: "", expense_date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/expenses"); const j = await r.json(); if (r.ok) setExpenses(j.data || []); }
    catch { showToast("error", "Failed"); } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      showToast("success", "Expense added"); setShowModal(false); load();
    } catch (e) { showToast("error", e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Expenses</h1><p className="mt-1 text-sm text-slate-500">Track store expenses</p></div>
        <Button onClick={() => { setForm({ category: "Other", amount: 0, description: "", expense_date: new Date().toISOString().split("T")[0] }); setShowModal(true); }}><Plus className="h-4 w-4" />Add Expense</Button>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm text-emerald-600">Total Expenses</p><p className="text-2xl font-bold text-emerald-800">{fmt(totalExpenses)}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : expenses.length === 0 ? <EmptyState icon={<Receipt className="h-6 w-6 text-slate-400" />} title="No expenses recorded" />
        : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-slate-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Date</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Category</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Description</th><th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Amount</th></tr></thead>
          <tbody className="divide-y">{expenses.map(ex => <tr key={ex.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-sm text-slate-500">{ex.expense_date}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{ex.category}</span></td><td className="px-4 py-3 text-sm text-slate-500">{ex.description || "—"}</td><td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(parseFloat(String(ex.amount)))}</td></tr>)}</tbody></table></div>}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense">
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5"><label className="block text-sm font-medium text-slate-700">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <Input label="Amount (Rs.)" type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} required />
          <Input label="Date" type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} required />
          <Input label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional" />
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" loading={saving}>Add Expense</Button></div>
        </form>
      </Modal>
    </div>
  );
}
