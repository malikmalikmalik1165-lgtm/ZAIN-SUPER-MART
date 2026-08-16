"use client";

import { STORE } from "@/lib/constants";
import { useAuth } from "@/lib/hooks/use-auth";
import { Store, Phone, MapPin, UserCheck, Loader2 } from "@/components/icons";

export default function SettingsPage() {
  const { user, loading } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Application configuration and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Store Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            Store Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Store Name</p>
                <p className="text-sm font-medium text-slate-800">{STORE.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Phone Number</p>
                <p className="text-sm font-medium text-slate-800">{STORE.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Location</p>
                <p className="text-sm font-medium text-slate-800">{STORE.address}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Store settings editing will be available in a future phase.
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            Account
          </h3>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading account info...
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Username</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Role</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.role === "admin" ? "Admin / Owner" : user.role}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Not signed in</p>
          )}
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            User management and role assignments will be available in a future phase.
          </div>
        </div>

        {/* App Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            Application
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-400">Version</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">1.0.0</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-400">Phase</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">Phase 1 — Foundation</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-400">Platform</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">Next.js + Supabase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
