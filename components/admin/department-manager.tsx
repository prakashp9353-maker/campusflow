'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { createClient } from '@/lib/supabase/client'

export type DepartmentRecord = { id: string; name: string; description: string | null }

export function DepartmentManager({ initialDepartments }: { initialDepartments: DepartmentRecord[] }) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function changeDepartment(id: string, field: 'name' | 'description', value: string) {
    setDepartments((current) => current.map((department) => (
      department.id === id ? { ...department, [field]: value } : department
    )))
  }

  async function createDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('departments')
      .insert({ name: name.trim(), description: description.trim() || null })
      .select('id,name,description')
      .single()
    if (insertError || !data) {
      setError(insertError?.message ?? 'Department could not be created.')
      return
    }
    setDepartments((current) => [...current, data].sort((left, right) => left.name.localeCompare(right.name)))
    setName('')
    setDescription('')
    setMessage('Department created.')
  }

  async function saveDepartment(department: DepartmentRecord) {
    setBusyId(department.id)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('departments')
      .update({ name: department.name.trim(), description: department.description?.trim() || null })
      .eq('id', department.id)
    setBusyId('')
    if (updateError) {
      setError(updateError.message)
      return
    }
    setMessage('Department saved.')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createDepartment} className="panel grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Department name">
          {(props) => <TextInput {...props} value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />}
        </Field>
        <Field label="Description">
          {(props) => <TextInput {...props} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} />}
        </Field>
        <div className="sm:col-span-2"><Button type="submit" disabled={!name.trim()}>Add department</Button></div>
      </form>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {message && <p role="status" className="text-sm text-ok">{message}</p>}

      {departments.length === 0 ? (
        <div className="panel p-6 text-sm text-muted">No departments have been created.</div>
      ) : (
        <ul className="space-y-3">
          {departments.map((department) => (
            <li key={department.id} className="panel grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
              <Field label="Name">
                {(props) => <TextInput {...props} value={department.name} onChange={(event) => changeDepartment(department.id, 'name', event.target.value)} required maxLength={100} />}
              </Field>
              <Field label="Description">
                {(props) => <TextInput {...props} value={department.description ?? ''} onChange={(event) => changeDepartment(department.id, 'description', event.target.value)} maxLength={500} />}
              </Field>
              <Button type="button" variant="secondary" disabled={!department.name.trim()} loading={busyId === department.id} onClick={() => saveDepartment(department)}>
                Save
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
