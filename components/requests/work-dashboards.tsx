import Link from 'next/link'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Inbox, Ticket } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SlaBadge, StatusBadge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { getSlaState } from '@/lib/sla'
import type { RequestView } from '@/lib/request-views'

const slaState = (request: RequestView) => getSlaState({
  createdAt: new Date(request.created_at),
  dueAt: new Date(request.due_at),
  status: request.status,
})

export function AdminRequestDashboard({ requests }: { requests: RequestView[] }) {
  const count = (status: RequestView['status']) => requests.filter((request) => request.status === status).length
  const overdue = requests.filter((request) => slaState(request) === 'overdue' || request.escalated).length
  const dueSoon = requests.filter((request) => slaState(request) === 'warning').length

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total requests" value={requests.length} icon={Ticket} />
        <StatCard label="Pending" value={count('pending')} icon={Clock3} />
        <StatCard label="Assigned" value={count('assigned')} icon={Inbox} />
        <StatCard label="In progress" value={count('in_progress')} icon={Activity} />
        <StatCard label="Completed" value={count('completed')} icon={CheckCircle2} />
        <StatCard label="Overdue / escalated" value={overdue} icon={AlertTriangle} />
        <StatCard label="Due soon" value={dueSoon} icon={Clock3} />
      </div>

      <nav aria-label="Campus operations shortcuts" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: '/admin/requests', label: 'All requests', description: 'Search, filter, and manage requests.' },
          { href: '/admin/services', label: 'Services', description: 'Manage the campus service catalogue.' },
          { href: '/admin/departments', label: 'Departments', description: 'Manage service-owning teams.' },
          { href: '/admin/staff', label: 'Staff assignments', description: 'Review eligible assignment targets.' },
          { href: '/admin/analytics', label: 'Analytics', description: 'Review request and SLA performance.' },
          { href: '/admin/escalations', label: 'Escalations', description: 'Focus on overdue work.' },
          { href: '/admin/notifications', label: 'Notifications', description: 'Review campus operations updates.' },
        ].map((shortcut) => (
          <Link key={shortcut.href} href={shortcut.href} className="panel p-4 transition-colors hover:border-blue/50">
            <h2 className="text-sm font-semibold">{shortcut.label}</h2>
            <p className="mt-1 text-xs text-muted">{shortcut.description}</p>
          </Link>
        ))}
      </nav>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-semibold">Latest requests</h2>
          <Link href="/admin/requests" className="text-sm font-medium text-blue hover:text-cyan">View all</Link>
        </div>
        {requests.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">Submitted requests will appear here.</p>
        ) : (
          <ul className="divide-y divide-line">
            {requests.slice(0, 6).map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-48 flex-1">
                  <Link href={`/admin/requests/${request.public_id}`} className="font-medium hover:text-cyan">{request.public_id} · {request.title}</Link>
                  <p className="mt-1 text-xs text-muted">{request.student_name ?? 'Unknown student'} · {request.service_name ?? 'Campus service'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={request.status} />
                  <SlaBadge state={slaState(request)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}