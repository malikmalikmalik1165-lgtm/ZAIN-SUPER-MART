import { STORE } from "@/lib/constants";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
          ZSM
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{STORE.name}</h1>
        <p className="text-slate-400 mb-6">{STORE.address}</p>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-4xl mb-4">📡</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">You are Offline</h2>
          <p className="text-sm text-slate-600 mb-4">
            Internet connection is not available. Some features may be limited.
          </p>

          <div className="space-y-2 text-left text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-emerald-600">✓</span>
              <span className="text-emerald-800">View cached products</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-emerald-600">✓</span>
              <span className="text-emerald-800">Scan barcodes</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-emerald-600">✓</span>
              <span className="text-emerald-800">Create offline sales</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-emerald-600">✓</span>
              <span className="text-emerald-800">Print receipts</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <span className="text-amber-600">⏳</span>
              <span className="text-amber-800">Sales will sync when online</span>
            </div>
          </div>

          <a
            href="/dashboard"
            className="mt-6 block w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Continue to App
          </a>
        </div>
      </div>
    </div>
  );
}
