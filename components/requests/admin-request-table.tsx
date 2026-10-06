'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EscalatedBadge, PriorityBadge, SlaBadge, StatusBadge } from '@/components/ui/badge'
import { Field, inputClass, TextInput } from '@/components/ui/field'
import type { RequestView } from '@/lib/request-views'
import { getSlaState } from '@/lib/sla'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/constants'
import type { Priority, RequestStatus } from '@/lib/types'

const dateTime = (value: string) => new Date(value).toLocaleString()

export function AdminRequestTable({
  requests,
  initialSlaFilter = 'all',
  includeEscalatedInOverdue = false,
}: {
  requests: RequestView[]
  initialSlaFilter?: string
  includeEscalatedInOverdue?: boolean
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [department, setDepartment] = useState('all')
  const [sla, setSla] = useState(initialSlaFilter)
  const [sort, setSort] = useState<'newest' | 'oldest' | 'due-soon' | 'due-late'>('newest')

  const departments = Array.from(new Map(requests.map((request) => [
    request.department_id ?? 'none', request.department_name ?? 'No department',
  ])).entries())
  const normalizedSearch = search.trim().toLowerCase()
  const filtered = requests
    .filter((request) => status === 'all' || request.status === status)
    .filter((request) => priority === 'all' || request.priority === priority)
    .filter((request) => department === 'all' || (request.department_id ?? 'none') === department)
    .filter((request) => {
      const state = getSlaState({
        createdAt: new Date(request.created_at),
        dueAt: new Date(request.due_at),
        status: request.status,
      })
      return sla === 'all'
        || state === sla
        || (sla === 'overdue' && includeEscalatedInOverdue && request.escalated)
    })
    .filter((request) => !normalizedSearch || [
      request.public_id, request.title, request.student_name, request.student_email,
      request.service_name, request.department_name, request.assigned_name,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch)))
    .sort((left, right) => {
      if (sort === 'due-soon' || sort === 'due-late') {
        const difference = new Date(left.due_at).getTime() - new Date(right.due_at).getTime()
        return sort === 'due-soon' ? difference : -difference
      }
      const difference = new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      return sort === 'newest' ? -difference : difference
    })

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Field label="Search">
          {(props) => <TextInput {...props} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, title, student, service" />}
        </Field>
        <Field label="Status">
          {(props) => (
            <select {...props} value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Priority">
          {(props) => (
            <select {...props} value={priority} onChange={(event) => setPriority(event.target.value)} className={inputClass}>
              <option value="all">All priorities</option>
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Department">
          {(props) => (
            <select {...props} value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass}>
              <option value="all">All departments</option>
              {departments.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          )}
        </Field>
        <Field label="SLA state">
          {(props) => (
            <select {...props} value={sla} onChange={(event) => setSla(event.target.value)} className={inputClass}>
              <option value="all">All SLA states</option>
              <option value="on_track">On track</option>
              <option value="warning">Due soon</option>
              <option value="overdue">Overdue</option>
              <option value="closed">Closed</option>
            </select>
          )}
        </Field>
        <Field label="Sort">
          {(props) => (
            <select {...props} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className={inputClass}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="due-soon">Due soonest</option>
              <option value="due-late">Due latest</option>
            </select>
          )}
        </Field>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No matching requests" body="Adjust the search or filters to see more requests." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="border-b border-line bg-raised/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Request</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Assigned staff</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Due / SLA</th>
                  <th className="px-4 py-3 font-medium">Escalation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((request) => (
                  <tr key={request.id} className="align-top hover:bg-raised/40">
                    <td className="px-4 py-4">
                      <Link href={`/admin/requests/${request.public_id}`} className="font-medium text-text hover:text-cyan">{request.public_id}</Link>
                      <p className="mt-1 max-w-56 text-muted">{request.title}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div>{request.student_name ?? 'Unknown student'}</div>
                      <div className="mt-1 text-xs text-muted">{request.student_email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-4">{request.service_name ?? '—'}</td>
                    <td className="px-4 py-4">{request.department_name ?? '—'}</td>
                    <td className="px-4 py-4">{request.assigned_name ?? 'Unassigned'}</td>
                    <td className="px-4 py-4"><PriorityBadge priority={request.priority as Priority} /></td>
                    <td className="px-4 py-4"><StatusBadge status={request.status as RequestStatus} /></td>
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
          <p className="border-t border-line px-4 py-3 text-xs text-muted">{filtered.length} of {requests.length} requests</p>
        </div>
      )}
    </div>
  )
}