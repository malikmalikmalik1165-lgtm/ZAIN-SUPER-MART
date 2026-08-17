import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
  placeholder?: boolean;
}

export function MetricCard({
  title,
  value,
  icon,
  subtitle,
  placeholder = false,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800 tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {placeholder && (
            <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              Placeholder
            </span>
          )}
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50">
          {icon}
        </div>
      </div>
    </div>
  );
}
