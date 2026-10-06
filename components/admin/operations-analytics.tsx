import { Activity, AlertTriangle, CheckCircle2, Clock3, Ticket } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { getSlaState } from '@/lib/sla'
import type { RequestView } from '@/lib/request-views'

export function OperationsAnalytics({ requests }: { requests: RequestView[] }) {
  const count = (predicate: (request: RequestView) => boolean) => requests.filter(predicate).length
  const dueSoon = count((request) => getSlaState({
    createdAt: new Date(request.created_at),
    dueAt: new Date(request.due_at),
    status: request.status,
  }) === 'warning')
  const overdue = count((request) => request.escalated || getSlaState({
    createdAt: new Date(request.created_at),
    dueAt: new Date(request.due_at),
    status: request.status,
  }) === 'overdue')

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total requests" value={requests.length} icon={Ticket} />
      <StatCard label="Pending" value={count((request) => request.status === 'pending')} icon={Clock3} />
      <StatCard label="Assigned" value={count((request) => request.status === 'assigned')} icon={Activity} />
      <StatCard label="In progress" value={count((request) => request.status === 'in_progress')} icon={Activity} />
      <StatCard label="Completed" value={count((request) => request.status === 'completed')} icon={CheckCircle2} />
      <StatCard label="Due soon" value={dueSoon} icon={Clock3} />
      <StatCard label="Overdue / escalated" value={overdue} icon={AlertTriangle} />
      <StatCard label="Critical priority" value={count((request) => request.priority === 'critical')} icon={AlertTriangle} />
    </div>
  )
}
