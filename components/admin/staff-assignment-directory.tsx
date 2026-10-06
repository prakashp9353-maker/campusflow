'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { DepartmentRecord } from '@/components/admin/department-manager'
import { createClient } from '@/lib/supabase/client'

type StaffRecord = {
  id: string
  full_name: string
  staff_department_id: string | null
}

export function StaffAssignmentDirectory({
  initialStaff,
  departments,
}: {
  initialStaff: StaffRecord[]
  departments: DepartmentRecord[]
}) {
  const [staff, setStaff] = useState(initialStaff)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const departmentOptions = [
    { value: '', label: 'No department' },
    ...departments.map(({ id, name }) => ({ value: id, label: name })),
  ]

  async function saveAssignment(member: StaffRecord) {
    setBusyId(member.id)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ staff_department_id: member.staff_department_id })
      .eq('id', member.id)
    setBusyId('')
    if (updateError) {
      setError(updateError.message)
      return
    }
    setMessage('Assignment target updated.')
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {message && <p role="status" className="text-sm text-ok">{message}</p>}
      {staff.length === 0 ? (
        <div className="panel p-6 text-sm text-muted">No staff assignment targets are configured.</div>
      ) : (
        <ul className="space-y-3">
          {staff.map((member) => (
            <li key={member.id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-48 flex-1">
                <h2 className="font-medium">{member.full_name}</h2>
                <p className="mt-1 text-xs text-muted">Staff assignment target</p>
              </div>
              <div className="w-full sm:w-72">
                <Select
                  options={departmentOptions}
                  value={member.staff_department_id ?? ''}
                  onChange={(value) => setStaff((current) => current.map((entry) => (
                    entry.id === member.id ? { ...entry, staff_department_id: value || null } : entry
                  )))}
                  placeholder="Select a department"
                />
              </div>
              <Button type="button" variant="secondary" loading={busyId === member.id} onClick={() => saveAssignment(member)}>
                Save
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
