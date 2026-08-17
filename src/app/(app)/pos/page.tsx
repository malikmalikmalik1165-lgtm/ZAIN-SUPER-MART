"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { STORE } from "@/lib/constants";
import {
  Search,
  Loader2,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Banknote,
  CreditCard,
  Printer,
  ShoppingBag,
  X,
  Check,
  Package,
  AlertTriangle,
} from "@/components/icons";
import type { Product, CartItem, PaymentMethod, Sale } from "@/lib/types/database";
import { PAYMENT_METHODS } from "@/lib/types/database";
import { BarcodeScanner } from "@/components/barcode-scanner";

export default function POSPage() {
  // Product search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState(0);

  // Payment
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Receipt
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Barcode create product redirect
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);

  const { showToast } = useToast();

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const grandTotal = Math.max(0, subtotal - cartDiscount);
  const change = paymentMethod === "cash" ? Math.max(0, amountPaid - grandTotal) : 0;

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories?active=true")
      .then((r) => r.json())
      .then((json) => { if (json.data) setCategories(json.data); })
      .catch(() => {});
  }, []);

  // Search products
  const searchProducts = useCallback(async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (categoryFilter) params.set("category_id", categoryFilter);
      params.set("active", "true");
      params.set("limit", "20");

      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (res.ok) setSearchResults(json.data || []);
    } catch {
      showToast("error", "Failed to search products");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, categoryFilter, showToast]);

  useEffect(() => {
    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchProducts]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      showToast("error", `${product.name} is out of stock`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showToast("error", `Only ${product.stock_quantity} available`);
          return prev;
        }
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_price - i.discount }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          unit: product.unit,
          unit_price: product.sale_price,
          stock_available: product.stock_quantity,
          quantity: 1,
          discount: 0,
          line_total: product.sale_price,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const q = Math.min(qty, i.stock_available);
        if (qty > i.stock_available) {
          showToast("error", `Only ${i.stock_available} available`);
        }
        return { ...i, quantity: q, line_total: q * i.unit_price - i.discount };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  // Open payment modal
  const openPayment = () => {
    if (cart.length === 0) {
      showToast("error", "Cart is empty");
      return;
    }
    setAmountPaid(grandTotal);
    setShowPayment(true);
  };

  // Process sale
  const processSale = async () => {
    if (processing) return;
    if (paymentMethod === "cash" && amountPaid < grandTotal) {
      showToast("error", "Amount paid is less than total");
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
          line_total: i.line_total,
        })),
        subtotal,
        discount: cartDiscount,
        total: grandTotal,
        payment_method: paymentMethod,
        amount_paid: paymentMethod === "cash" ? amountPaid : grandTotal,
        change_amount: paymentMethod === "cash" ? change : 0,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setCompletedSale(json.data);
      setShowPayment(false);
      setShowReceipt(true);
      setCart([]);
      setCartDiscount(0);
      showToast("success", "Sale completed successfully!");

      // Refresh product search to update stock
      searchProducts();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Sale failed");
    } finally {
      setProcessing(false);
    }
  };

  // New Sale after receipt
  const newSale = () => {
    setShowReceipt(false);
    setCompletedSale(null);
    setSearchQuery("");
    searchRef.current?.focus();
  };

  const formatPrice = (n: number) => `Rs. ${n.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:flex-row gap-4 -m-4 lg:-m-6 p-4 lg:p-6 bg-slate-100">
      {/* LEFT: Product Search */}
      <div className="flex flex-col lg:w-[55%] xl:w-[60%] min-h-0">
        {/* Barcode Scanner */}
        <div className="mb-3 space-y-2">
          <BarcodeScanner
            onProductFound={(product) => addToCart(product)}
            onCreateProduct={(barcode) => {
              setPendingBarcode(barcode);
              showToast("info", `Navigate to Products to create: ${barcode}`);
            }}
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {searchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                {searchQuery ? "No products found" : "Search or browse products"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 p-3">
              {searchResults.map((product) => {
                const outOfStock = product.stock_quantity <= 0;
                const inCart = cart.find((i) => i.product_id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={`relative rounded-lg border p-3 text-left transition-all ${
                      outOfStock
                        ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                        : inCart
                        ? "border-emerald-300 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    {product.barcode && (
                      <p className="text-[11px] text-slate-400 truncate">{product.barcode}</p>
                    )}
                    <p className="mt-1 text-base font-bold text-emerald-700">{formatPrice(product.sale_price)}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[11px] ${outOfStock ? "text-red-500 font-medium" : "text-slate-400"}`}>
                        {outOfStock ? "Out of stock" : `Stock: ${product.stock_quantity}`}
                      </span>
                      {inCart && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="flex flex-col lg:w-[45%] xl:w-[40%] min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <ShoppingCart className="h-5 w-5" />
            Cart
            {cart.length > 0 && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{cart.length}</span>
            )}
          </h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="h-4 w-4 text-red-500" /> Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <ShoppingBag className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Click products to add</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.product_name}</p>
                    <p className="text-xs text-slate-500">{formatPrice(item.unit_price)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 hover:bg-slate-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 hover:bg-slate-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-semibold text-slate-800">{formatPrice(item.line_total)}</p>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Pay */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Discount</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={cartDiscount}
              onChange={(e) => setCartDiscount(Math.max(0, Math.min(subtotal, parseFloat(e.target.value) || 0)))}
              className="w-24 text-right rounded border border-slate-200 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-800">
            <span>Total</span>
            <span className="text-emerald-700">{formatPrice(grandTotal)}</span>
          </div>
          <Button
            className="w-full mt-2"
            size="lg"
            onClick={openPayment}
            disabled={cart.length === 0}
          >
            <Banknote className="h-5 w-5" />
            Pay {formatPrice(grandTotal)}
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Complete Payment" size="md">
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-sm text-emerald-600">Total Amount</p>
            <p className="text-3xl font-bold text-emerald-700">{formatPrice(grandTotal)}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setPaymentMethod(m.value);
                    if (m.value !== "cash") setAmountPaid(grandTotal);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    paymentMethod === m.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m.value === "cash" && <Banknote className="h-4 w-4" />}
                  {m.value === "card" && <CreditCard className="h-4 w-4" />}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "cash" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount Received (Rs.)</label>
                <input
                  type="number"
                  min={grandTotal}
                  step="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg font-semibold text-center focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
              </div>
              <div className="flex justify-between rounded-lg bg-blue-50 px-4 py-3">
                <span className="text-sm font-medium text-blue-600">Change</span>
                <span className="text-lg font-bold text-blue-700">{formatPrice(change)}</span>
              </div>
              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[grandTotal, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000]
                  .filter((v, i, arr) => arr.indexOf(v) === i && v >= grandTotal)
                  .slice(0, 4)
                  .map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmountPaid(amt)}
                      className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                        amountPaid === amt ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {formatPrice(amt)}
                    </button>
                  ))}
              </div>
            </>
          )}

          {amountPaid < grandTotal && paymentMethod === "cash" && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Amount is less than total
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPayment(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={processSale}
              loading={processing}
              disabled={processing || (paymentMethod === "cash" && amountPaid < grandTotal)}
            >
              <Check className="h-4 w-4" />
              Complete Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={newSale} title="Receipt" size="md">
        {completedSale && (
          <div>
            <div id="receipt-content" className="space-y-4 text-sm">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h3 className="text-lg font-bold text-slate-800">{STORE.name}</h3>
                <p className="text-xs text-slate-500">{STORE.address}</p>
                <p className="text-xs text-slate-500">Ph: {STORE.phone}</p>
                <div className="mt-2 text-xs text-slate-500">
                  <p>Invoice: <span className="font-semibold text-slate-700">{completedSale.sale_number}</span></p>
                  <p>{new Date(completedSale.created_at).toLocaleString("en-PK")}</p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSale.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-700">{item.product_name}</td>
                      <td className="py-1.5 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-1.5 text-right text-slate-600">{formatPrice(item.unit_price)}</td>
                      <td className="py-1.5 text-right font-medium text-slate-800">{formatPrice(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(completedSale.subtotal)}</span></div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{formatPrice(completedSale.discount)}</span></div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-1">
                  <span>Total</span><span className="text-emerald-700">{formatPrice(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Paid ({completedSale.payment_method})</span><span>{formatPrice(completedSale.amount_paid)}</span>
                </div>
                {completedSale.change_amount > 0 && (
                  <div className="flex justify-between text-blue-600 font-medium">
                    <span>Change</span><span>{formatPrice(completedSale.change_amount)}</span>
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-slate-400 pt-2 border-t border-dashed border-slate-300">
                Thank you for shopping at {STORE.name}!
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  const content = document.getElementById("receipt-content");
                  if (content) {
                    const win = window.open("", "_blank");
                    if (win) {
                      win.document.write(`<html><head><title>Receipt - ${completedSale.sale_number}</title><style>body{font-family:monospace;max-width:300px;margin:0 auto;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:4px 2px;text-align:left}th{font-size:11px}td{font-size:12px}.right{text-align:right}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #ccc;margin:8px 0}.title{text-align:center;font-size:16px;font-weight:bold}.sub{text-align:center;font-size:11px;color:#666}</style></head><body>`);
                      win.document.write(`<p class="title">${STORE.name}</p>`);
                      win.document.write(`<p class="sub">${STORE.address}<br>Ph: ${STORE.phone}</p>`);
                      win.document.write(`<p class="sub">Invoice: ${completedSale.sale_number}<br>${new Date(completedSale.created_at).toLocaleString("en-PK")}</p>`);
                      win.document.write(`<div class="line"></div>`);
                      win.document.write(`<table><tr><th>Item</th><th class="center">Qty</th><th class="right">Price</th><th class="right">Total</th></tr>`);
                      completedSale.items?.forEach((it) => {
                        win.document.write(`<tr><td>${it.product_name}</td><td class="center">${it.quantity}</td><td class="right">Rs.${it.unit_price}</td><td class="right">Rs.${it.line_total}</td></tr>`);
                      });
                      win.document.write(`</table><div class="line"></div>`);
                      win.document.write(`<p class="right">Subtotal: Rs.${completedSale.subtotal}</p>`);
                      if (completedSale.discount > 0) win.document.write(`<p class="right">Discount: -Rs.${completedSale.discount}</p>`);
                      win.document.write(`<p class="right bold">Total: Rs.${completedSale.total}</p>`);
                      win.document.write(`<p class="right">Paid (${completedSale.payment_method}): Rs.${completedSale.amount_paid}</p>`);
                      if (completedSale.change_amount > 0) win.document.write(`<p class="right">Change: Rs.${completedSale.change_amount}</p>`);
                      win.document.write(`<div class="line"></div><p class="center sub">Thank you for shopping!</p>`);
                      win.document.write(`</body></html>`);
                      win.document.close();
                      win.print();
                    }
                  }
                }}
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button className="flex-1" onClick={newSale}>
                <Plus className="h-4 w-4" />
                New Sale
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
