import {
  Activity,
  CheckCircle2,
  Clock3,
  Inbox,
  Ticket,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/ui/stat-card'
import { buttonLink } from '@/components/ui/button-link'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/session'

function statusClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-slate-700/60 text-slate-200'
    case 'assigned':
      return 'bg-blue-500/15 text-blue-300'
    case 'in_progress':
      return 'bg-cyan-500/15 text-cyan-300'
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-300'
    default:
      return 'bg-slate-700/60 text-slate-200'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'in_progress':
      return 'In Progress'
    case 'pending':
      return 'Pending'
    case 'assigned':
      return 'Assigned'
    case 'completed':
      return 'Completed'
    default:
      return status
  }
}

export async function Dashboard() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('requests')
    .select('id, public_id, title, status, priority, created_at, due_at')
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <EmptyState
        icon={Inbox}
        title="Unable to load dashboard"
        body="We couldn't load your request statistics right now. Please refresh and try again."
        action={
          <Link
            href="/student/requests"
            className={buttonLink()}
          >
            View my requests
          </Link>
        }
      />
    )
  }

  const studentRequests = requests ?? []

  const pending = studentRequests.filter(
    (request) => request.status === 'pending'
  ).length

  const inProgress = studentRequests.filter(
    (request) =>
      request.status === 'assigned' ||
      request.status === 'in_progress'
  ).length

  const completed = studentRequests.filter(
    (request) => request.status === 'completed'
  ).length

  const active = pending + inProgress

  return (
    <div className="space-y-8">
        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active requests"
            value={active}
            icon={Ticket}
          />

          <StatCard
            label="Pending"
            value={pending}
            icon={Clock3}
          />

          <StatCard
            label="In progress"
            value={inProgress}
            icon={Activity}
          />

          <StatCard
            label="Completed"
            value={completed}
            icon={CheckCircle2}
          />
        </div>

        {/* Recent Requests */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent requests
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Your latest campus service requests.
              </p>
            </div>

            <Link
              href="/student/requests"
              className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              View all
            </Link>
          </div>

          {studentRequests.length === 0 ? (
            <div className="px-6 py-10">
              <EmptyState
                icon={Inbox}
                title="No requests yet"
                body="When you submit a request, it will appear here with its status and SLA information."
                action={
                  <Link
                    href="/student/requests/new"
                    className={buttonLink()}
                  >
                    Create a request
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {studentRequests.slice(0, 5).map((request) => (
                <Link
                  key={request.id}
                  href={`/student/requests/${request.public_id}`}
                  className="block px-6 py-5 transition hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-cyan-400">
                          {request.public_id}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                            request.status
                          )}`}
                        >
                          {statusLabel(request.status)}
                        </span>
                      </div>

                      <p className="mt-2 truncate font-medium text-white">
                        {request.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(request.created_at).toLocaleDateString(
                          'en-IN',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-slate-500">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}