"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  Search,
  Loader2,
  Warehouse,
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Package,
} from "@/components/icons";
import type { InventoryMovement, Product } from "@/lib/types/database";
import {
  MOVEMENT_TYPES,
  getStockStatus,
  getStockStatusLabel,
  getStockStatusColor,
} from "@/lib/types/database";

export default function InventoryPage() {
  const [view, setView] = useState<"stock" | "movements">("stock");
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stockFilter) params.set("stock_status", stockFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);
      setProducts(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, stockFilter, page, showToast]);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (movementTypeFilter) params.set("movement_type", movementTypeFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/inventory?${params}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);
      setMovements(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to load movements");
    } finally {
      setLoading(false);
    }
  }, [movementTypeFilter, page, showToast]);

  useEffect(() => {
    if (view === "stock") {
      fetchProducts();
    } else {
      fetchMovements();
    }
  }, [view, fetchProducts, fetchMovements]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return <ArrowUp className="h-4 w-4 text-emerald-500" />;
      case "STOCK_OUT":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const config = MOVEMENT_TYPES.find((t) => t.value === type);
    const variant = type === "STOCK_IN" ? "success" : type === "STOCK_OUT" ? "danger" : "info";
    return <Badge variant={variant}>{config?.label || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor stock levels and movement history
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => { setView("stock"); setPage(1); }}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "stock"
                ? "bg-emerald-100 text-emerald-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Warehouse className="h-4 w-4" />
            Stock Levels
          </button>
          <button
            onClick={() => { setView("movements"); setPage(1); }}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "movements"
                ? "bg-emerald-100 text-emerald-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <History className="h-4 w-4" />
            Movement History
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {view === "stock" ? (
          <>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </>
        ) : (
          <select
            value={movementTypeFilter}
            onChange={(e) => { setMovementTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Movement Types</option>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : view === "stock" ? (
          /* Stock Levels View */
          products.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6 text-slate-400" />}
              title="No products found"
              description="Add products to track their stock levels"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Current Stock</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Min. Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity, product.minimum_stock);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{product.name}</p>
                            {product.barcode && (
                              <p className="text-xs text-slate-500">{product.barcode}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {product.category?.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-500 capitalize">
                            {product.unit}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-lg font-bold ${
                              stockStatus === "out_of_stock" ? "text-red-600" :
                              stockStatus === "low_stock" ? "text-amber-600" : "text-slate-800"
                            }`}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-500">
                            {product.minimum_stock}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStockStatusColor(stockStatus)}`}>
                              {getStockStatusLabel(stockStatus)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : (
          /* Movement History View */
          movements.length === 0 ? (
            <EmptyState
              icon={<History className="h-6 w-6 text-slate-400" />}
              title="No movements recorded"
              description="Stock adjustments will appear here"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Previous</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">New</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(movement.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{movement.product?.name || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {getMovementIcon(movement.movement_type)}
                          {getMovementBadge(movement.movement_type)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={
                          movement.movement_type === "STOCK_IN" ? "text-emerald-600" :
                          movement.movement_type === "STOCK_OUT" ? "text-red-600" : "text-blue-600"
                        }>
                          {movement.movement_type === "STOCK_IN" ? "+" : 
                           movement.movement_type === "STOCK_OUT" ? "-" : ""}
                          {Math.abs(movement.quantity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        {movement.previous_stock}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                        {movement.new_stock}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                        {movement.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
