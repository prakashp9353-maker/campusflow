import { cn } from '@/lib/utils'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/constants'
import type { Priority, RequestStatus, SlaState } from '@/lib/types'

const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium'

const priorityTone: Record<Priority, string> = {
  critical: 'bg-danger/15 text-danger',
  high: 'bg-warn/15 text-warn',
  medium: 'bg-blue/15 text-blue',
  low: 'bg-faint/20 text-muted',
}
const statusTone: Record<RequestStatus, string> = {
  pending: 'bg-faint/20 text-muted',
  assigned: 'bg-blue/15 text-blue',
  in_progress: 'bg-violet/15 text-violet',
  completed: 'bg-ok/15 text-ok',
}
const slaTone: Record<SlaState, string> = {
  on_track: 'bg-ok/15 text-ok',
  warning: 'bg-warn/15 text-warn',
  overdue: 'bg-danger/15 text-danger',
  closed: 'bg-faint/20 text-muted',
}
const slaLabel: Record<SlaState, string> = {
  on_track: 'On track', warning: 'SLA warning', overdue: 'Overdue', closed: 'Closed',
}

export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <span className={cn(base, priorityTone[priority])}>{PRIORITY_LABEL[priority]}</span>
)
export const StatusBadge = ({ status }: { status: RequestStatus }) => (
  <span className={cn(base, statusTone[status])}>{STATUS_LABEL[status]}</span>
)
export const SlaBadge = ({ state }: { state: SlaState }) => (
  <span className={cn(base, slaTone[state])}>{slaLabel[state]}</span>
)
export const EscalatedBadge = () => (
  <span className={cn(base, 'bg-danger/15 text-danger')}>Escalated</span>
)
