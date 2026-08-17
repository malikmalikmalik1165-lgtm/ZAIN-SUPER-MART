"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORE, NAV_SECTIONS, DEVELOPER } from "@/lib/constants";
import { NetworkStatus } from "@/components/network-status";
import { PwaInstallButton } from "@/components/pwa-install";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Users,
  UserCheck,
  Receipt,
  BarChart3,
  Settings,
  Store,
  Phone,
  MapPin,
  Tag,
} from "@/components/icons";

const iconMap = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Users,
  UserCheck,
  Receipt,
  BarChart3,
  Settings,
  Tag,
} as const;

type IconName = keyof typeof iconMap;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Store header */}
        <div className="border-b border-slate-700/50 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 font-bold text-sm">
              ZSM
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-wide">
                {STORE.name}
              </h1>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                <span>{STORE.phone}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{STORE.address}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? "mt-5" : ""}>
              {section.label && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon as IconName];
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {Icon && <Icon className="h-4.5 w-4.5 flex-shrink-0" />}
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-700/50 px-4 py-3 space-y-2">
          <NetworkStatus />
          <PwaInstallButton />
          <div className="text-center pt-1">
            <p className="text-[10px] text-slate-500">
              Developed by {DEVELOPER.name}
            </p>
            <p className="text-[10px] text-slate-600">{DEVELOPER.phone}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
