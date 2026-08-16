"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SystemStatus } from "@/components/dashboard/system-status";
import { STORE } from "@/lib/constants";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  UserCheck,
  Truck,
  Tag,
  Loader2,
} from "@/components/icons";
import type { ProductInventoryStats } from "@/lib/types/database";

export default function DashboardPage() {
  const [stats, setStats] = useState<ProductInventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const json = await res.json();
        if (res.ok) {
          setStats(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome to {STORE.name} Management System
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <MetricCard
            title="Today's Sales"
            value={`Rs. ${(stats?.todaySales || 0).toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            subtitle={`${stats?.todayTransactions || 0} transaction(s) today`}
          />
        )}
        <MetricCard
          title="Today's Profit"
          value="Rs. 0"
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          subtitle="Profit tracking requires purchase cost data"
          placeholder
        />
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <MetricCard
            title="Total Products"
            value={stats?.activeProducts.toString() || "0"}
            icon={<Package className="h-5 w-5 text-violet-600" />}
            subtitle={`${stats?.totalProducts || 0} total (incl. inactive)`}
          />
        )}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <MetricCard
            title="Low Stock Items"
            value={stats?.lowStockProducts.toString() || "0"}
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            subtitle={stats?.lowStockProducts ? "Needs attention" : "All items stocked"}
          />
        )}
        <MetricCard
          title="Customer Credit"
          value="Rs. 0"
          icon={<UserCheck className="h-5 w-5 text-orange-600" />}
          subtitle="Customer module coming later"
          placeholder
        />
        <MetricCard
          title="Supplier Payables"
          value="Rs. 0"
          icon={<Truck className="h-5 w-5 text-red-600" />}
          subtitle="Supplier module coming later"
          placeholder
        />
      </div>

      {/* Phase 2 Summary */}
      {!loading && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                <Package className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.activeProducts}</p>
                <p className="text-xs text-slate-500">Active Products</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Tag className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalCategories}</p>
                <p className="text-xs text-slate-500">Categories</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.lowStockProducts}</p>
                <p className="text-xs text-slate-500">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.outOfStockProducts}</p>
                <p className="text-xs text-slate-500">Out of Stock</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System status + Quick info */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SystemStatus />

        {/* Store Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            Store Information
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-400">Store Name</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {STORE.name}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-400">Phone</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {STORE.phone}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-400">Location</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {STORE.address}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-400">Version</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                Phase 2 — Products & Inventory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
