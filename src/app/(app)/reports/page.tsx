"use client";
import { useState, useEffect } from "react";
import { Loader2, BarChart3, DollarSign, TrendingUp, Package, UserCheck, Receipt, Truck } from "@/components/icons";

export default function ReportsPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<{ total: number; created_at: string; payment_method: string; discount: number }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [sr, slr] = await Promise.all([fetch("/api/stats"), fetch("/api/sales?limit=200")]);
        const [sj, slj] = await Promise.all([sr.json(), slr.json()]);
        if (sr.ok) setStats(sj.data || {});
        if (slr.ok) setSales(slj.data || []);
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const fmt = (n: number) => `Rs. ${(n || 0).toLocaleString()}`;
  const totalRevenue = sales.reduce((s, sl) => s + parseFloat(String(sl.total)), 0);
  const totalDiscount = sales.reduce((s, sl) => s + parseFloat(String(sl.discount || 0)), 0);
  const cashSales = sales.filter(s => s.payment_method === "cash").reduce((sum, s) => sum + parseFloat(String(s.total)), 0);
  const creditSales = sales.filter(s => s.payment_method === "credit").reduce((sum, s) => sum + parseFloat(String(s.total)), 0);

  const today = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter(s => s.created_at.startsWith(today));
  const todayTotal = todaySales.reduce((sum, s) => sum + parseFloat(String(s.total)), 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Reports</h1><p className="mt-1 text-sm text-slate-500">Business overview & analytics</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Today's Revenue", value: fmt(todayTotal), icon: <DollarSign className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50" },
          { title: "Total Revenue", value: fmt(totalRevenue), icon: <TrendingUp className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50" },
          { title: "Total Transactions", value: String(sales.length), icon: <Receipt className="h-5 w-5 text-violet-600" />, bg: "bg-violet-50" },
          { title: "Total Discounts", value: fmt(totalDiscount), icon: <BarChart3 className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50" },
        ].map((c, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>{c.icon}</div>
              <div><p className="text-2xl font-bold text-slate-800">{c.value}</p><p className="text-xs text-slate-500">{c.title}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Payment Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Cash Sales", value: cashSales, color: "bg-emerald-500" },
              { label: "Credit Sales", value: creditSales, color: "bg-red-500" },
              { label: "Card/Other", value: totalRevenue - cashSales - creditSales, color: "bg-blue-500" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">{item.label}</span><span className="font-semibold">{fmt(item.value)}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${item.color}`} style={{ width: `${totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Inventory Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Active Products", value: stats.activeProducts || 0, icon: <Package className="h-4 w-4 text-violet-500" /> },
              { label: "Low Stock", value: stats.lowStockProducts || 0, icon: <Package className="h-4 w-4 text-amber-500" /> },
              { label: "Out of Stock", value: stats.outOfStockProducts || 0, icon: <Package className="h-4 w-4 text-red-500" /> },
              { label: "Categories", value: stats.totalCategories || 0, icon: <BarChart3 className="h-4 w-4 text-emerald-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">{item.icon}<span className="text-sm text-slate-600">{item.label}</span></div>
                <span className="text-lg font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Recent Sales</h3>
        {sales.length === 0 ? <p className="text-sm text-slate-500">No sales recorded</p>
        : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-slate-50"><th className="px-3 py-2 text-left text-xs text-slate-500">Date</th><th className="px-3 py-2 text-left text-xs text-slate-500">Method</th><th className="px-3 py-2 text-right text-xs text-slate-500">Discount</th><th className="px-3 py-2 text-right text-xs text-slate-500">Total</th></tr></thead>
          <tbody className="divide-y">{sales.slice(0, 20).map((s, i) => <tr key={i} className="hover:bg-slate-50"><td className="px-3 py-2 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.payment_method === "cash" ? "bg-emerald-50 text-emerald-700" : s.payment_method === "credit" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{s.payment_method}</span></td><td className="px-3 py-2 text-right text-slate-500">{parseFloat(String(s.discount)) > 0 ? fmt(parseFloat(String(s.discount))) : "—"}</td><td className="px-3 py-2 text-right font-semibold">{fmt(parseFloat(String(s.total)))}</td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}
