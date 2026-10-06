import { SLA_HOURS, SLA_WARNING_FRACTION } from './constants'
import type { Priority, RequestStatus, SlaState } from './types'

const HOUR_MS = 3_600_000

export function slaWindowMs(priority: Priority): number {
  return SLA_HOURS[priority] * HOUR_MS
}

export function computeDueAt(createdAt: Date, priority: Priority): Date {
  return new Date(createdAt.getTime() + slaWindowMs(priority))
}

export function getSlaState(args: {
  createdAt: Date
  dueAt: Date
  status: RequestStatus
  now?: Date
}): SlaState {
  if (args.status === 'completed') return 'closed'
  const now = (args.now ?? new Date()).getTime()
  const remaining = args.dueAt.getTime() - now
  if (remaining <= 0) return 'overdue'
  const total = args.dueAt.getTime() - args.createdAt.getTime()
  return total > 0 && remaining / total <= SLA_WARNING_FRACTION ? 'warning' : 'on_track'
}

/** Formats a duration as HH:MM:SS; negative durations are prefixed with "-". */
export function formatCountdown(ms: number): string {
  const sign = ms < 0 ? '-' : ''
  const total = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`
}

/** Average of (completedAt - createdAt) in hours, or null when nothing has been completed. */
export function averageResolutionHours(
  items: ReadonlyArray<{ createdAt: Date; completedAt: Date }>,
): number | null {
  if (items.length === 0) return null
  const total = items.reduce((sum, i) => sum + (i.completedAt.getTime() - i.createdAt.getTime()), 0)
  return total / items.length / HOUR_MS
}
