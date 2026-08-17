"use client";
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SystemStatus } from "@/components/dashboard/system-status";
import { STORE } from "@/lib/constants";
import { DollarSign, TrendingUp, Package, AlertTriangle, UserCheck, Truck, Tag, Loader2, Receipt, ShoppingCart } from "@/components/icons";

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(j => { if (j.data) setStats(j.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `Rs. ${(n || 0).toLocaleString()}`;
  const L = loading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome to {STORE.name} Management System</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {L ? <div className="rounded-xl border bg-white p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : <MetricCard title="Today's Sales" value={fmt(stats?.todaySales || 0)} icon={<DollarSign className="h-5 w-5 text-emerald-600" />} subtitle={`${stats?.todayTransactions || 0} transaction(s)`} />}
        {L ? <div className="rounded-xl border bg-white p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : <MetricCard title="Total Products" value={String(stats?.activeProducts || 0)} icon={<Package className="h-5 w-5 text-violet-600" />} subtitle={`${stats?.totalProducts || 0} total`} />}
        {L ? <div className="rounded-xl border bg-white p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : <MetricCard title="Low Stock" value={String(stats?.lowStockProducts || 0)} icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} subtitle={stats?.lowStockProducts ? "Needs attention" : "All stocked"} />}
        {L ? <div className="rounded-xl border bg-white p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : <MetricCard title="Customer Credit" value={fmt(stats?.totalCredit || 0)} icon={<UserCheck className="h-5 w-5 text-red-600" />} subtitle={`${stats?.customersCount || 0} customers`} />}
        {L ? <div className="rounded-xl border bg-white p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : <MetricCard title="Expenses" value={fmt(stats?.totalExpenses || 0)} icon={<Receipt className="h-5 w-5 text-orange-600" />} subtitle="Total recorded" />}
        {L ? <div className="rounded-xl border bg-white p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : <MetricCard title="Categories" value={String(stats?.totalCategories || 0)} icon={<Tag className="h-5 w-5 text-emerald-600" />} subtitle="Active" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SystemStatus />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Store Information</h3>
          <div className="space-y-3">
            {[{ l: "Store Name", v: STORE.name }, { l: "Phone", v: STORE.phone }, { l: "Location", v: STORE.address }].map((item, i) => (
              <div key={i} className="rounded-lg bg-slate-50 px-3 py-2.5"><p className="text-xs text-slate-400">{item.l}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{item.v}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
