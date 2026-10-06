'use client'

import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'
import { NotificationItem } from '@/components/notifications/notification-item'
import type { AppRole } from '@/lib/types'

export type NotificationView = {
  id: string
  user_id: string
  request_id: string | null
  request_public_id?: string | null
  title: string
  body: string
  kind: string
  is_read: boolean
  created_at: string
}

export function NotificationList({
  notifications: initialNotifications,
  role,
  requestLookupWarning,
}: {
  notifications: NotificationView[]
  role: AppRole
  requestLookupWarning?: string
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  async function markAsRead(notificationId: string) {
    setPendingIds((current) => new Set(current).add(notificationId))
    setErrors((current) => {
      const next = { ...current }
      delete next[notificationId]
      return next
    })

    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        setErrors((current) => ({
          ...current,
          [notificationId]: result?.error ?? 'This notification could not be marked as read.',
        }))
        return
      }

      setNotifications((current) => current.map((notification) => (
        notification.id === notificationId ? { ...notification, is_read: true } : notification
      )))
      router.refresh()
    } catch {
      setErrors((current) => ({
        ...current,
        [notificationId]: 'Unable to reach the server. Please try again.',
      }))
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(notificationId)
        return next
      })
    }
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        body="New updates about your campus requests will appear here."
      />
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {unreadCount === 0 ? 'All notifications read' : `${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`}
        </p>
        <BellRing className="size-4 text-cyan" aria-hidden />
      </div>

      {requestLookupWarning && (
        <p role="status" className="rounded-control border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          {requestLookupWarning}
        </p>
      )}

      <ol className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            role={role}
            pending={pendingIds.has(notification.id)}
            error={errors[notification.id]}
            onMarkAsRead={() => markAsRead(notification.id)}
          />
        ))}
      </ol>
    </section>
  )
}
