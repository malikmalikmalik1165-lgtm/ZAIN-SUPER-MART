"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Search,
  Pencil,
  Loader2,
  Package,
  Filter,
  PackagePlus,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Barcode,
  Printer,
} from "@/components/icons";
import { BarcodeDisplay } from "@/components/barcode-display";
import { BarcodeLabelPrint } from "@/components/barcode-label-print";
import type {
  Product,
  ProductFormData,
  Category,
  StockStatus,
} from "@/lib/types/database";
import {
  PRODUCT_UNITS,
  getStockStatus,
  getStockStatusLabel,
  getStockStatusColor,
} from "@/lib/types/database";

const STOCK_STATUS_OPTIONS = [
  { value: "", label: "All Stock Status" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    barcode: "",
    category_id: "",
    unit: "piece",
    purchase_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    minimum_stock: 0,
    is_active: true,
  });
  const [stockAdjustment, setStockAdjustment] = useState({
    type: "STOCK_IN" as "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT",
    quantity: 0,
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?active=true");
      const json = await res.json();
      if (res.ok) setCategories(json.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category_id", categoryFilter);
      if (stockFilter) params.set("stock_status", stockFilter);
      if (showInactive) params.set("active", "false");
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
  }, [search, categoryFilter, stockFilter, showInactive, page, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      barcode: "",
      category_id: "",
      unit: "piece",
      purchase_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      minimum_stock: 0,
      is_active: true,
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      category_id: product.category_id || "",
      unit: product.unit,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      stock_quantity: product.stock_quantity,
      minimum_stock: product.minimum_stock,
      is_active: product.is_active,
    });
    setFormError("");
    setShowModal(true);
  };

  const openStockModal = (product: Product) => {
    setStockProduct(product);
    setStockAdjustment({ type: "STOCK_IN", quantity: 0, note: "" });
    setFormError("");
    setShowStockModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Product name is required");
      return;
    }

    try {
      setSaving(true);
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      showToast(
        "success",
        editingProduct ? "Product updated successfully" : "Product created successfully"
      );
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;
    setFormError("");

    if (stockAdjustment.quantity <= 0 && stockAdjustment.type !== "ADJUSTMENT") {
      setFormError("Quantity must be greater than zero");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: stockProduct.id,
          movement_type: stockAdjustment.type,
          quantity: stockAdjustment.type === "ADJUSTMENT" 
            ? stockAdjustment.quantity 
            : stockAdjustment.quantity,
          note: stockAdjustment.note,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      showToast("success", `Stock adjusted: ${json.product.previous_stock} → ${json.product.new_stock}`);
      setShowStockModal(false);
      fetchProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to deactivate "${product.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      showToast("success", "Product deactivated");
      fetchProducts();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to deactivate product");
    }
  };

  const handleReactivate = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      showToast("success", "Product reactivated");
      fetchProducts();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to reactivate product");
    }
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {STOCK_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Show inactive
        </label>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6 text-slate-400" />}
            title="No products found"
            description={search || categoryFilter || stockFilter 
              ? "Try adjusting your filters" 
              : "Create your first product to get started"}
            action={
              !(search || categoryFilter || stockFilter) && (
                <Button onClick={openCreateModal} size="sm">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Purchase</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Sale</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock_quantity, product.minimum_stock);
                    return (
                      <tr key={product.id} className={`hover:bg-slate-50 ${!product.is_active ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-800">{product.name}</p>
                            {product.barcode && (
                              <p className="text-xs text-slate-500">{product.barcode}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {product.category?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 capitalize">
                          {product.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatPrice(product.purchase_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                          {formatPrice(product.sale_price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-slate-800">
                            {product.stock_quantity}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">
                            / min {product.minimum_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStockStatusColor(stockStatus)}`}>
                            {getStockStatusLabel(stockStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {product.barcode && (
                              <Button variant="ghost" size="sm" onClick={() => { setLabelProduct(product); setShowLabelModal(true); }} title="Print Barcode">
                                <Printer className="h-4 w-4 text-violet-500" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openStockModal(product)} title="Adjust Stock">
                              <PackagePlus className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(product)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {product.is_active ? (
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(product)} title="Deactivate">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleReactivate(product)} title="Reactivate">
                                <RotateCcw className="h-4 w-4 text-emerald-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Pepsi 500ml"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Barcode</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan, enter, or generate"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={generatingBarcode}
                onClick={async () => {
                  setGeneratingBarcode(true);
                  try {
                    const res = await fetch("/api/barcode/generate", { method: "POST" });
                    const json = await res.json();
                    if (res.ok && json.data?.barcode) {
                      setFormData({ ...formData, barcode: json.data.barcode });
                      showToast("success", "Barcode generated");
                    } else {
                      showToast("error", json.error || "Failed to generate");
                    }
                  } catch { showToast("error", "Failed to generate barcode"); }
                  finally { setGeneratingBarcode(false); }
                }}
              >
                Generate
              </Button>
              {formData.barcode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, barcode: "" })}
                  title="Clear barcode"
                >
                  ✕
                </Button>
              )}
            </div>
            {formData.barcode && (
              <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-2">
                <BarcodeDisplay value={formData.barcode} height={40} width={1.5} />
              </div>
            )}
            <p className="text-xs text-slate-500">Scan existing barcode, type manually, or generate internal barcode</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Select
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductFormData["unit"] })}
              options={PRODUCT_UNITS.map((u) => ({ value: u.value, label: u.label }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Purchase Price (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Sale Price (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={formData.sale_price}
              onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Current Stock"
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              hint={editingProduct ? "Use Stock Adjustment for tracked changes" : undefined}
            />
            <Input
              label="Minimum Stock"
              type="number"
              min="0"
              value={formData.minimum_stock}
              onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
              hint="Alert when stock falls below this level"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="product_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="product_active" className="text-sm text-slate-700">
              Active product
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Adjust Stock"
      >
        {stockProduct && (
          <form onSubmit={handleStockAdjustment} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-800">{stockProduct.name}</p>
              <p className="text-sm text-slate-500">
                Current Stock: <span className="font-semibold text-slate-800">{stockProduct.stock_quantity}</span> {stockProduct.unit}
              </p>
            </div>

            <Select
              label="Adjustment Type"
              value={stockAdjustment.type}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, type: e.target.value as typeof stockAdjustment.type })}
              options={[
                { value: "STOCK_IN", label: "Stock In (Add)" },
                { value: "STOCK_OUT", label: "Stock Out (Remove)" },
                { value: "ADJUSTMENT", label: "Set Stock Level" },
              ]}
            />

            <Input
              label={stockAdjustment.type === "ADJUSTMENT" ? "New Stock Level" : "Quantity"}
              type="number"
              min="0"
              value={stockAdjustment.quantity}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) || 0 })}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Note</label>
              <textarea
                value={stockAdjustment.note}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, note: e.target.value })}
                placeholder="Reason for adjustment..."
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {stockAdjustment.type !== "ADJUSTMENT" && stockAdjustment.quantity > 0 && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                New stock will be:{" "}
                <span className="font-semibold">
                  {stockAdjustment.type === "STOCK_IN"
                    ? stockProduct.stock_quantity + stockAdjustment.quantity
                    : Math.max(0, stockProduct.stock_quantity - stockAdjustment.quantity)}
                </span>{" "}
                {stockProduct.unit}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowStockModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Adjust Stock
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Barcode Label Modal */}
      <Modal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        title="Barcode Label"
      >
        {labelProduct && labelProduct.barcode && (
          <BarcodeLabelPrint
            productName={labelProduct.name}
            barcode={labelProduct.barcode}
            salePrice={labelProduct.sale_price}
            onClose={() => setShowLabelModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}
