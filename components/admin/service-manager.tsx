'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { DepartmentRecord } from '@/components/admin/department-manager'

export type ServiceRecord = {
  id: string
  name: string
  description: string
  department_id: string | null
  expected_resolution_hours: number
  requirements: string | null
  is_active: boolean
}

export function ServiceManager({
  initialServices,
  departments,
}: {
  initialServices: ServiceRecord[]
  departments: DepartmentRecord[]
}) {
  const [services, setServices] = useState(initialServices)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [resolutionHours, setResolutionHours] = useState('24')
  const [requirements, setRequirements] = useState('')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function changeService<K extends keyof ServiceRecord>(id: string, field: K, value: ServiceRecord[K]) {
    setServices((current) => current.map((service) => (
      service.id === id ? { ...service, [field]: value } : service
    )))
  }

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('services')
      .insert({
        name: name.trim(),
        description: description.trim(),
        department_id: departmentId || null,
        expected_resolution_hours: Number(resolutionHours),
        requirements: requirements.trim() || null,
      })
      .select('id,name,description,department_id,expected_resolution_hours,requirements,is_active')
      .single()
    if (insertError || !data) {
      setError(insertError?.message ?? 'Service could not be created.')
      return
    }
    setServices((current) => [...current, data].sort((left, right) => left.name.localeCompare(right.name)))
    setName('')
    setDescription('')
    setDepartmentId('')
    setResolutionHours('24')
    setRequirements('')
    setMessage('Service created.')
  }

  async function saveService(service: ServiceRecord) {
    setBusyId(service.id)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('services')
      .update({
        name: service.name.trim(),
        description: service.description.trim(),
        department_id: service.department_id,
        expected_resolution_hours: service.expected_resolution_hours,
        requirements: service.requirements?.trim() || null,
        is_active: service.is_active,
      })
      .eq('id', service.id)
    setBusyId('')
    if (updateError) {
      setError(updateError.message)
      return
    }
    setMessage('Service saved.')
  }

  const departmentOptions = departments.map(({ id, name: departmentName }) => ({ value: id, label: departmentName }))

  return (
    <div className="space-y-6">
      <form onSubmit={createService} className="panel grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Service name">
          {(props) => <TextInput {...props} value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />}
        </Field>
        <Field label="Department">
          {(props) => <Select {...props} options={departmentOptions} value={departmentId} onChange={setDepartmentId} placeholder="Select a department" />}
        </Field>
        <Field label="Description">
          {(props) => <TextInput {...props} value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={1000} />}
        </Field>
        <Field label="Expected resolution (hours)">
          {(props) => <TextInput {...props} type="number" min={1} value={resolutionHours} onChange={(event) => setResolutionHours(event.target.value)} required />}
        </Field>
        <Field label="Requirements" hint="Optional">
          {(props) => <TextInput {...props} value={requirements} onChange={(event) => setRequirements(event.target.value)} maxLength={1000} />}
        </Field>
        <div className="flex items-end"><Button type="submit" disabled={!name.trim() || !departmentId || Number(resolutionHours) < 1}>Add service</Button></div>
      </form>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {message && <p role="status" className="text-sm text-ok">{message}</p>}

      {services.length === 0 ? (
        <div className="panel p-6 text-sm text-muted">No services have been created.</div>
      ) : (
        <ul className="space-y-4">
          {services.map((service) => (
            <li key={service.id} className="panel grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Service name">
                {(props) => <TextInput {...props} value={service.name} onChange={(event) => changeService(service.id, 'name', event.target.value)} required maxLength={100} />}
              </Field>
              <Field label="Department">
                {(props) => <Select {...props} options={departmentOptions} value={service.department_id ?? ''} onChange={(value) => changeService(service.id, 'department_id', value || null)} placeholder="Select a department" />}
              </Field>
              <Field label="Expected resolution (hours)">
                {(props) => <TextInput {...props} type="number" min={1} value={service.expected_resolution_hours} onChange={(event) => changeService(service.id, 'expected_resolution_hours', Number(event.target.value))} required />}
              </Field>
              <Field label="Description">
                {(props) => <TextInput {...props} value={service.description} onChange={(event) => changeService(service.id, 'description', event.target.value)} required maxLength={1000} />}
              </Field>
              <Field label="Requirements" hint="Optional">
                {(props) => <TextInput {...props} value={service.requirements ?? ''} onChange={(event) => changeService(service.id, 'requirements', event.target.value || null)} maxLength={1000} />}
              </Field>
              <div className="flex items-end justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={service.is_active}
                    onChange={(event) => changeService(service.id, 'is_active', event.target.checked)}
                    className="size-4 accent-cyan"
                  />
                  Published to students
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!service.name.trim() || !service.description.trim() || !service.department_id || service.expected_resolution_hours < 1}
                  loading={busyId === service.id}
                  onClick={() => saveService(service)}
                >
                  Save
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
