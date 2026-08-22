"use client";
import { useState, useEffect } from "react";
import { STORE, DEVELOPER } from "@/lib/constants";
import { useAuth } from "@/lib/hooks/use-auth";
import { Store, Phone, MapPin, UserCheck, Loader2, Printer, Settings } from "@/components/icons";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [receiptWidth, setReceiptWidth] = useState("58");

  useEffect(() => {
    const saved = localStorage.getItem("zsm_receipt_width");
    if (!saved) return;
    const frame = requestAnimationFrame(() => setReceiptWidth(saved));
    return () => cancelAnimationFrame(frame);
  }, []);

  const saveReceiptWidth = (w: string) => {
    setReceiptWidth(w);
    localStorage.setItem("zsm_receipt_width", w);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Application configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Store Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Store Information</h3>
          <div className="space-y-4">
            {[
              { icon: <Store className="h-5 w-5 text-slate-400" />, label: "Store Name", value: STORE.name },
              { icon: <Phone className="h-5 w-5 text-slate-400" />, label: "Phone", value: STORE.phone },
              { icon: <MapPin className="h-5 w-5 text-slate-400" />, label: "Location", value: STORE.address },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.icon}
                <div><p className="text-xs text-slate-400">{item.label}</p><p className="text-sm font-medium text-slate-800">{item.value}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Account</h3>
          {loading ? <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>
          : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-slate-400" />
                <div><p className="text-xs text-slate-400">Username</p><p className="text-sm font-medium text-slate-800">{user.username}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center"><div className="h-3 w-3 rounded-full bg-emerald-500" /></div>
                <div><p className="text-xs text-slate-400">Role</p><p className="text-sm font-medium text-slate-800">{user.role === "admin" ? "Admin / Owner" : user.role}</p></div>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">Not signed in</p>}
        </div>

        {/* Receipt Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2"><Printer className="h-5 w-5" />Receipt Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Receipt Width</label>
              <div className="flex gap-2">
                {["58", "80"].map(w => (
                  <button key={w} onClick={() => saveReceiptWidth(w)} className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${receiptWidth === w ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {w}mm
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">Select thermal printer paper width</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Currency</p>
              <p className="text-sm font-semibold text-slate-800">PKR (Rs.)</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Receipt Footer</p>
              <p className="text-sm text-slate-800">Thank you for shopping at {STORE.name}!</p>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2"><Settings className="h-5 w-5" />Application</h3>
          <div className="space-y-3">
            {[
              { label: "Version", value: "1.0.0" },
              { label: "Platform", value: "Next.js + Supabase" },
              { label: "Developer", value: `${DEVELOPER.name} • ${DEVELOPER.phone}` },
            ].map((item, i) => (
              <div key={i} className="rounded-lg bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
