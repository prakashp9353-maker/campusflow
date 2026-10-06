import Link from 'next/link'
import { Activity, ArrowLeft, Clock3 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EscalatedBadge, PriorityBadge, SlaBadge, StatusBadge } from '@/components/ui/badge'
import { getSlaState } from '@/lib/sla'
import type { RequestView } from '@/lib/request-views'

export type RequestActivityView = {
  id: string
  kind: string
  message: string | null
  created_at: string
  actor_name: string | null
}

export function RequestDetail({
  request,
  activity,
  backHref,
  actions,
  actionsTitle = 'Assignment',
}: {
  request: RequestView
  activity: RequestActivityView[]
  backHref: string
  actions?: React.ReactNode
  actionsTitle?: string
}) {
  const sla = getSlaState({
    createdAt: new Date(request.created_at),
    dueAt: new Date(request.due_at),
    status: request.status,
  })

  return (
    <div className="space-y-6">
      <PageHeader title={request.title} description={`${request.public_id} · ${request.service_name ?? 'Campus service'}`} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <SlaBadge state={sla} />
            {request.escalated && <EscalatedBadge />}
          </div>
          <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div><dt className="text-xs text-muted">Request ID</dt><dd className="mt-1 font-medium">{request.public_id}</dd></div>
            <div><dt className="text-xs text-muted">Service</dt><dd className="mt-1 font-medium">{request.service_name ?? '—'}</dd></div>
            <div><dt className="text-xs text-muted">Student</dt><dd className="mt-1 font-medium">{request.student_name ?? '—'}</dd><dd className="text-sm text-muted">{request.student_email ?? ''}</dd></div>
            <div><dt className="text-xs text-muted">Department</dt><dd className="mt-1 font-medium">{request.department_name ?? 'Unassigned'}</dd></div>
            <div><dt className="text-xs text-muted">Assigned to</dt><dd className="mt-1 font-medium">{request.assigned_name ?? 'Unassigned'}</dd></div>
            <div><dt className="text-xs text-muted">Location</dt><dd className="mt-1 font-medium">{request.location || 'Not specified'}</dd></div>
            <div><dt className="text-xs text-muted">Created</dt><dd className="mt-1 font-medium">{new Date(request.created_at).toLocaleString()}</dd></div>
            <div><dt className="text-xs text-muted">Due</dt><dd className="mt-1 font-medium">{new Date(request.due_at).toLocaleString()}</dd></div>
            {request.estimated_completion && <div><dt className="text-xs text-muted">Estimated completion</dt><dd className="mt-1 font-medium">{new Date(request.estimated_completion).toLocaleString()}</dd></div>}
            <div className="sm:col-span-2"><dt className="text-xs text-muted">Description</dt><dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text">{request.description}</dd></div>
          </dl>
        </section>

        {actions && <section className="panel h-fit p-6"><h2 className="text-base font-semibold">{actionsTitle}</h2><div className="mt-5">{actions}</div></section>}
      </div>

      <section className="panel p-6">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-cyan" aria-hidden />
          <h2 className="text-base font-semibold">Activity history</h2>
        </div>
        {activity.length === 0 ? (
          <p className="mt-5 text-sm text-muted">No activity recorded.</p>
        ) : (
          <ol className="mt-5 divide-y divide-line">
            {activity.map((entry) => (
              <li key={entry.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text">{entry.message ?? entry.kind.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(entry.created_at).toLocaleString()}{entry.actor_name ? ` · ${entry.actor_name}` : ''}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden />Back
      </Link>
    </div>
  )
}