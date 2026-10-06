'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { STATUS_LABEL } from '@/lib/constants'
import { nextStatuses } from '@/lib/status'
import type { RequestView } from '@/lib/request-views'
import type { RequestStatus } from '@/lib/types'
import { dispatchRequestEmails } from '@/lib/notification-email-client'

export function RequestAssignment({
  request,
  adminId,
  adminName,
}: {
  request: RequestView
  adminId: string
  adminName: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [emailWarning, setEmailWarning] = useState(false)
  const assignedToMe = request.assigned_to === adminId
  const canAssignToMe = request.status !== 'completed' && !assignedToMe

  async function assignToMe() {
    setBusy(true)
    setError('')
    setEmailWarning(false)

    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(request.id)}/assign`, {
        method: 'POST',
      })
      const result = await response.json() as { error?: string; updatedAt?: string | null }
      if (!response.ok) {
        setError(result.error ?? 'Request assignment could not be saved.')
        return
      }

      if (result.updatedAt) {
        const dispatched = await dispatchRequestEmails(request.id, result.updatedAt)
        setEmailWarning(!dispatched)
      }
      router.refresh()
    } catch {
      setError('Unable to reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted">Assigned to</p>
        <p className="mt-1 font-medium">
          {assignedToMe ? `${adminName} · Campus Manager` : request.assigned_name ?? 'Unassigned'}
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {emailWarning && <p role="status" className="text-sm text-warn">The request and in-app notification are saved, but email delivery could not be confirmed.</p>}
      {canAssignToMe && (
        <Button type="button" loading={busy} onClick={assignToMe}>
          Assign to me
        </Button>
      )}
    </div>
  )
}

export function AdminStatusActions({ request }: { request: RequestView }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [emailWarning, setEmailWarning] = useState(false)
  const availableMoves = nextStatuses('admin', request.status).filter((status) => (
    request.status === 'assigned'
      ? status === 'in_progress'
      : request.status === 'in_progress' && status === 'completed'
  ))

  async function moveTo(status: RequestStatus) {
    if (!availableMoves.includes(status)) return
    setBusy(true)
    setError('')
    setMessage('')
    setEmailWarning(false)
    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', request.id)
      .select('id,updated_at')
      .single()

    if (updateError) {
      setBusy(false)
      setError(updateError.message)
      return
    }

    const dispatched = data ? await dispatchRequestEmails(request.id, data.updated_at) : false
    setBusy(false)
    setEmailWarning(!dispatched)
    setMessage(`Status updated to ${STATUS_LABEL[status]}.`)
    router.refresh()
  }

  if (availableMoves.length === 0) {
    return <p className="text-sm text-muted">{request.status === 'completed' ? 'This request is complete.' : request.status === 'pending' ? 'Assign this request to the Campus Manager to continue.' : 'No status action is available.'}</p>
  }

  return (
    <div className="space-y-3">
      {availableMoves.map((status) => (
        <Button key={status} type="button" loading={busy} disabled={busy} onClick={() => moveTo(status)}>
          {status === 'in_progress' ? 'Start progress' : 'Mark completed'}
        </Button>
      ))}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {message && <p role="status" className="text-sm text-ok">{message}</p>}
      {emailWarning && <p role="status" className="text-sm text-warn">The request and in-app notification are saved, but email delivery could not be confirmed.</p>}
    </div>
  )
}