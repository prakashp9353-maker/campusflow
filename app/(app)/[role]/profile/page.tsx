import { PageHeader } from '@/components/ui/page-header'
import { DEPARTMENT_OPTIONS, SEMESTER_OPTIONS } from '@/lib/constants'
import { requireProfile } from '@/lib/session'

const ROLE_LABEL = { student: 'Student', staff: 'Staff', admin: 'Administrator' } as const

export default async function ProfilePage() {
  const p = await requireProfile()
  const department = DEPARTMENT_OPTIONS.find((d) => d.value === p.academic_department)?.label
  const semester = SEMESTER_OPTIONS.find((s) => s.value === String(p.semester))?.label

  const rows: Array<[string, string | null | undefined]> = [
    ['Full name', p.full_name],
    ['Email', p.email],
    ['Role', ROLE_LABEL[p.role]],
    ...(p.role === 'student'
      ? ([['Student ID', p.student_id], ['Department', department], ['Semester', semester]] as Array<[string, string | undefined | null]>)
      : []),
  ]

  return (
    <>
      <PageHeader title="Profile" description="The details on your CampusFlow account." />
      <dl className="panel divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-6 py-4 sm:grid-cols-[200px_1fr]">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-medium">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
