'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { dispatchRequestEmails } from '@/lib/notification-email-client'

type Service = { id: string; name: string }

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const

export function RequestForm({
  services,
  initialServiceId,
}: {
  services: Service[]
  initialServiceId: string
}) {
  const [serviceId, setServiceId] = useState(initialServiceId)
  const [priority, setPriority] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [publicId, setPublicId] = useState('')
  const [emailWarning, setEmailWarning] = useState(false)

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      setError('Your session could not be verified. Sign in again and retry.')
      setSubmitting(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('requests')
      .insert({
        student_id: user.id,
        service_id: serviceId,
        title: String(form.get('title') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        location: String(form.get('location') ?? '').trim() || null,
        priority,
      })
      .select('id,public_id,updated_at')
      .single()

    if (insertError || !data) {
      setSubmitting(false)
      setError(insertError?.message ?? 'The request could not be submitted. Please try again.')
      return
    }

    const dispatched = await dispatchRequestEmails(data.id, data.updated_at)
    setEmailWarning(!dispatched)
    setSubmitting(false)
    setPublicId(data.public_id)
  }

  if (publicId) {
    return (
      <section className="panel max-w-2xl p-6" role="status">
        <h2 className="text-lg font-semibold">Request submitted</h2>
        <p className="mt-2 text-sm text-muted">Your request ID is <strong className="text-text">{publicId}</strong>.</p>
        {emailWarning && <p className="mt-3 text-sm text-warn">Your request and in-app notification are saved, but email delivery could not be confirmed.</p>}
        <Link href={`/student/requests/${publicId}`} className="mt-5 inline-flex text-sm font-medium text-blue hover:text-cyan">
          View request
        </Link>
      </section>
    )
  }

  return (
    <form onSubmit={submitRequest} className="panel grid max-w-2xl gap-5 p-6">
      <Field label="Service">
        {(props) => (
          <Select
            {...props}
            options={services.map((service) => ({ value: service.id, label: service.name }))}
            value={serviceId}
            onChange={setServiceId}
            placeholder={services.length ? 'Select a service' : 'No active services available'}
          />
        )}
      </Field>
      <Field label="Request Title">
        {(props) => <TextInput {...props} name="title" required minLength={3} maxLength={120} placeholder="Briefly summarize the issue" />}
      </Field>
      <Field label="Description">
        {(props) => (
          <textarea
            {...props}
            name="description"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="Include the details needed to address your request"
            className="w-full rounded-control border border-line bg-surface px-3.5 py-3 text-sm text-text placeholder:text-faint transition-colors hover:border-blue/40 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
        )}
      </Field>
      <Field label="Location" hint="Optional">
        {(props) => <TextInput {...props} name="location" maxLength={200} placeholder="Building, room, or campus area" />}
      </Field>
      <Field label="Priority">
        {(props) => (
          <Select
            {...props}
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
            placeholder="Select priority"
          />
        )}
      </Field>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div>
        <Button type="submit" loading={submitting} disabled={!serviceId || services.length === 0}>
          Submit request
        </Button>
      </div>
    </form>
  )
}