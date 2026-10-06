import Link from 'next/link'
import { Inbox, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EscalatedBadge, PriorityBadge, SlaBadge, StatusBadge } from '@/components/ui/badge'
import { buttonLink } from '@/components/ui/button-link'
import { getSlaState } from '@/lib/sla'
import type { RequestView } from '@/lib/request-views'

const dateTime = (value: string) => new Date(value).toLocaleString()

export function StudentRequestList({ requests }: { requests: RequestView[] }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        body="Requests you submit will appear here with their current status and SLA."
        action={<Link href="/student/requests/new" className={buttonLink()}><Plus className="size-4" />Create a request</Link>}
      />
    )
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-line bg-raised/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Request</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Assigned staff</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Due / SLA</th>
              <th className="px-4 py-3 font-medium">Escalation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {requests.map((request) => (
              <tr key={request.id} className="align-top hover:bg-raised/40">
                <td className="px-4 py-4">
                  <Link href={`/student/requests/${request.public_id}`} className="font-medium text-text hover:text-cyan">
                    {request.public_id}
                  </Link>
                  <p className="mt-1 max-w-56 text-muted">{request.title}</p>
                </td>
                <td className="px-4 py-4">{request.service_name ?? '—'}</td>
                <td className="px-4 py-4"><StatusBadge status={request.status} /></td>
                <td className="px-4 py-4"><PriorityBadge priority={request.priority} /></td>
                <td className="px-4 py-4">{request.department_name ?? '—'}</td>
                <td className="px-4 py-4">{request.assigned_name ?? 'Unassigned'}</td>
                <td className="whitespace-nowrap px-4 py-4 text-muted">{dateTime(request.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div>{dateTime(request.due_at)}</div>
                  <div className="mt-2"><SlaBadge state={getSlaState({ createdAt: new Date(request.created_at), dueAt: new Date(request.due_at), status: request.status })} /></div>
                </td>
                <td className="px-4 py-4">{request.escalated ? <EscalatedBadge /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}