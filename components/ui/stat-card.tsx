import type { LucideIcon } from 'lucide-react'

/** `value` is null until real data is available; it renders as an em dash, never a made-up number. */
export function StatCard({
  label, value, icon: Icon, hint,
}: { label: string; value: string | number | null; icon: LucideIcon; hint?: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className="size-4 text-cyan" aria-hidden />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value ?? '—'}</p>
      {hint && <p className="mt-1 text-sm text-faint">{hint}</p>}
    </div>
  )
}
