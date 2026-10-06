import type { Priority, RequestStatus } from './types'

export type Relation<T> = T | T[] | null

export type RequestView = {
  id: string
  public_id: string
  student_id: string
  service_id: string
  department_id: string | null
  assigned_to: string | null
  title: string
  description: string
  location: string | null
  priority: Priority
  status: RequestStatus
  created_at: string
  due_at: string
  estimated_completion: string | null
  escalated: boolean
  service_name: string | null
  department_name: string | null
  assigned_name: string | null
  assigned_email: string | null
  student_name: string | null
  student_email: string | null
}

export type RequestQueryRow = Omit<RequestView,
  'service_name' | 'department_name' | 'assigned_name' | 'assigned_email' | 'student_name' | 'student_email'
> & {
  service: Relation<{ name: string }>
  department: Relation<{ name: string }>
  assignee: Relation<{ full_name: string; email: string }>
  student: Relation<{ full_name: string; email: string }>
}

export function one<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value
}

export function toRequestView(row: RequestQueryRow): RequestView {
  const service = one(row.service)
  const department = one(row.department)
  const assignee = one(row.assignee)
  const student = one(row.student)

  return {
    ...row,
    service_name: service?.name ?? null,
    department_name: department?.name ?? null,
    assigned_name: assignee?.full_name ?? null,
    assigned_email: assignee?.email ?? null,
    student_name: student?.full_name ?? null,
    student_email: student?.email ?? null,
  }
}