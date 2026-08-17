"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { STORE, DEVELOPER } from "@/lib/constants";
import { Loader2, BarChart3, DollarSign, TrendingUp, Package, Receipt, FileText, Printer } from "@/components/icons";

export default function ReportsPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<{ total: number; created_at: string; payment_method: string; discount: number; sale_number?: string }[]>([]);

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
  const todaySalesList = sales.filter(s => s.created_at.startsWith(today));
  const todayTotal = todaySalesList.reduce((sum, s) => sum + parseFloat(String(s.total)), 0);

  // PDF Download
  const downloadPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Daily Report - ${STORE.name}</title>
<style>
@page{size:A4;margin:15mm}
body{font-family:Arial,sans-serif;font-size:12px;color:#333;max-width:700px;margin:0 auto;padding:20px}
h1{font-size:18px;text-align:center;margin:0}
.sub{text-align:center;font-size:11px;color:#666;margin-bottom:20px}
.section{margin-top:15px;border-top:1px solid #ddd;padding-top:10px}
.section h2{font-size:14px;color:#059669;margin:0 0 8px}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #eee;font-size:11px}
th{background:#f8f8f8;font-weight:bold}
.r{text-align:right}
.total{font-weight:bold;font-size:13px}
.footer{text-align:center;margin-top:30px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px}
@media print{body{padding:0}}
</style></head><body>
<h1>${STORE.name}</h1>
<p class="sub">${STORE.address} | Ph: ${STORE.phone}</p>
<p class="sub"><b>Daily Business Report</b> — ${new Date().toLocaleDateString("en-PK", { dateStyle: "full" })}</p>

<div class="section"><h2>Revenue Summary</h2>
<table>
<tr><td>Today's Sales</td><td class="r total">${fmt(todayTotal)}</td></tr>
<tr><td>Today's Transactions</td><td class="r">${todaySalesList.length}</td></tr>
<tr><td>Total Revenue (all time)</td><td class="r">${fmt(totalRevenue)}</td></tr>
<tr><td>Total Discounts</td><td class="r">${fmt(totalDiscount)}</td></tr>
</table></div>

<div class="section"><h2>Profit</h2>
<table>
<tr><td>Gross Profit (Today)</td><td class="r">${fmt(stats.todayGrossProfit || 0)}</td></tr>
<tr><td>Today's Expenses</td><td class="r">${fmt(stats.todayExpenses || 0)}</td></tr>
<tr><td>Net Profit (Today)</td><td class="r total">${fmt(stats.todayNetProfit || 0)}</td></tr>
</table></div>

<div class="section"><h2>Payment Breakdown</h2>
<table>
<tr><td>Cash</td><td class="r">${fmt(cashSales)}</td></tr>
<tr><td>Credit/Udhaar</td><td class="r">${fmt(creditSales)}</td></tr>
<tr><td>Other</td><td class="r">${fmt(totalRevenue - cashSales - creditSales)}</td></tr>
</table></div>

<div class="section"><h2>Inventory</h2>
<table>
<tr><td>Active Products</td><td class="r">${stats.activeProducts || 0}</td></tr>
<tr><td>Low Stock</td><td class="r">${stats.lowStockProducts || 0}</td></tr>
<tr><td>Out of Stock</td><td class="r">${stats.outOfStockProducts || 0}</td></tr>
</table></div>

<div class="section"><h2>Customer Credit</h2>
<table>
<tr><td>Total Customers</td><td class="r">${stats.customersCount || 0}</td></tr>
<tr><td>Outstanding Credit</td><td class="r total">${fmt(stats.totalCredit || 0)}</td></tr>
</table></div>

<div class="section"><h2>Recent Sales</h2>
<table><tr><th>Date</th><th>Invoice</th><th>Method</th><th class="r">Amount</th></tr>`);
    todaySalesList.slice(0, 30).forEach(s => {
      win.document.write(`<tr><td>${new Date(s.created_at).toLocaleTimeString("en-PK")}</td><td>${s.sale_number || "—"}</td><td>${s.payment_method}</td><td class="r">${fmt(parseFloat(String(s.total)))}</td></tr>`);
    });
    win.document.write(`</table></div>
<div class="footer">
<p>Generated on ${new Date().toLocaleString("en-PK")}</p>
<p>${STORE.name} | ${STORE.address}</p>
<p>Developed by ${DEVELOPER.name} • ${DEVELOPER.phone}</p>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Reports</h1><p className="mt-1 text-sm text-slate-500">Business overview & analytics</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={downloadPDF}><FileText className="h-4 w-4" />📄 Download PDF</Button>
          <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Today's Revenue", value: fmt(todayTotal), icon: <DollarSign className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50" },
          { title: "Gross Profit", value: fmt(stats.todayGrossProfit || 0), icon: <TrendingUp className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50" },
          { title: "Net Profit", value: fmt(stats.todayNetProfit || 0), icon: <TrendingUp className="h-5 w-5 text-emerald-700" />, bg: "bg-emerald-50" },
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
              { label: "Cash", value: cashSales, color: "bg-emerald-500" },
              { label: "Credit/Udhaar", value: creditSales, color: "bg-red-500" },
              { label: "Other", value: totalRevenue - cashSales - creditSales, color: "bg-blue-500" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">{item.label}</span><span className="font-semibold">{fmt(item.value)}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${item.color}`} style={{ width: `${totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Inventory & Credit</h3>
          <div className="space-y-3">
            {[
              { label: "Active Products", value: stats.activeProducts || 0, icon: <Package className="h-4 w-4 text-violet-500" /> },
              { label: "Low Stock", value: stats.lowStockProducts || 0, icon: <Package className="h-4 w-4 text-amber-500" /> },
              { label: "Out of Stock", value: stats.outOfStockProducts || 0, icon: <Package className="h-4 w-4 text-red-500" /> },
              { label: "Outstanding Credit", value: fmt(stats.totalCredit || 0), icon: <Receipt className="h-4 w-4 text-red-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">{item.icon}<span className="text-sm text-slate-600">{item.label}</span></div>
                <span className="text-lg font-bold text-slate-800">{typeof item.value === "number" ? item.value : item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Recent Sales</h3>
        {sales.length === 0 ? <p className="text-sm text-slate-500">No sales recorded</p>
        : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-slate-50"><th className="px-3 py-2 text-left text-xs text-slate-500">Date</th><th className="px-3 py-2 text-left text-xs text-slate-500">Invoice</th><th className="px-3 py-2 text-left text-xs text-slate-500">Method</th><th className="px-3 py-2 text-right text-xs text-slate-500">Discount</th><th className="px-3 py-2 text-right text-xs text-slate-500">Total</th></tr></thead>
          <tbody className="divide-y">{sales.slice(0, 30).map((s, i) => <tr key={i} className="hover:bg-slate-50"><td className="px-3 py-2 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td><td className="px-3 py-2 text-sm">{s.sale_number || "—"}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.payment_method === "cash" ? "bg-emerald-50 text-emerald-700" : s.payment_method === "credit" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{s.payment_method}</span></td><td className="px-3 py-2 text-right text-slate-500">{parseFloat(String(s.discount)) > 0 ? fmt(parseFloat(String(s.discount))) : "—"}</td><td className="px-3 py-2 text-right font-semibold">{fmt(parseFloat(String(s.total)))}</td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}
