import type { Priority, RequestStatus } from './types'

export const DEPARTMENT_OPTIONS = [
  { value: 'CSE', label: 'Computer Science and Engineering (CSE)' },
  { value: 'ISE', label: 'Information Science and Engineering (ISE)' },
  { value: 'AIML', label: 'Artificial Intelligence and Machine Learning (AIML)' },
  { value: 'AIDS', label: 'Artificial Intelligence and Data Science (AI&DS)' },
  { value: 'CSD', label: 'Computer Science and Design (CSD)' },
] as const

export const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  return { value: String(n), label: `${n}${suffix} Semester` }
})

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
}

/** Resolution targets from the problem statement. */
export const SLA_HOURS: Record<Priority, number> = {
  critical: 4,
  high: 12,
  medium: 24,
  low: 72,
}

/** A request enters the "warning" state when this share of its SLA window remains. */
export const SLA_WARNING_FRACTION = 0.25
