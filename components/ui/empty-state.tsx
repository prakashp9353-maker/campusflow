import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon, title, body, action,
}: { icon: LucideIcon; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-blue/10 text-blue">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
