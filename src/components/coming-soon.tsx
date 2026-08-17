import { Construction } from "@/components/icons";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Construction className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {description || "This module will be available in a future phase."}
        </p>
        <div className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
