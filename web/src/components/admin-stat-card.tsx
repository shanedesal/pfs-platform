import type { LucideIcon } from "lucide-react";

type AdminStatCardProps = {
  label: string;
  value: string | number | null;
  icon: LucideIcon;
  loading?: boolean;
  hint?: string;
};

export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  loading = false,
  hint,
}: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate/15 bg-paper-soft p-5 dark:bg-ink-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon size={18} />
        </span>
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate/10" />
      ) : (
        <p className="mt-2 font-display text-3xl font-semibold text-ink dark:text-paper">
          {value ?? "—"}
        </p>
      )}

      {hint && <p className="mt-1 text-xs text-slate/70">{hint}</p>}
    </div>
  );
}
