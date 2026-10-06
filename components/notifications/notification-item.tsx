'use client'

import Link from 'next/link'
import { ArrowUpRight, Check, Clock3 } from 'lucide-react'
import type { AppRole } from '@/lib/types'
import type { NotificationView } from '@/components/notifications/notification-list'

export function NotificationItem({
  notification,
  role,
  pending,
  error,
  onMarkAsRead,
}: {
  notification: NotificationView
  role: AppRole
  pending: boolean
  error?: string
  onMarkAsRead: () => void
}) {
  const requestHref = notification.request_public_id
    ? `/${role}/requests/${notification.request_public_id}`
    : null
  const createdAt = new Date(notification.created_at)
  const age = Math.max(0, Date.now() - createdAt.getTime())
  const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const timeLabel = age < 60_000
    ? relativeTime.format(-Math.floor(age / 1_000), 'second')
    : age < 3_600_000
      ? relativeTime.format(-Math.floor(age / 60_000), 'minute')
      : age < 86_400_000
        ? relativeTime.format(-Math.floor(age / 3_600_000), 'hour')
        : age < 2_592_000_000
          ? relativeTime.format(-Math.floor(age / 86_400_000), 'day')
          : createdAt.toLocaleDateString()

  return (
    <li
      className={`panel relative overflow-hidden p-5 transition-colors ${
        notification.is_read ? 'opacity-75' : 'border-l-2 border-l-cyan bg-blue/[0.04]'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className={`mt-1 grid size-9 shrink-0 place-items-center rounded-xl ${
          notification.is_read ? 'bg-raised text-faint' : 'bg-cyan/10 text-cyan'
        }`}>
          <Clock3 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`font-semibold ${notification.is_read ? 'text-muted' : 'text-text'}`}>
              {notification.title}
            </h2>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              notification.is_read ? 'bg-raised text-faint' : 'bg-cyan/10 text-cyan'
            }`}>
              {notification.is_read ? 'Read' : 'Unread'}
            </span>
          </div>
          <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
            notification.is_read ? 'text-faint' : 'text-muted'
          }`}>
            {notification.body}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-faint">
            <time dateTime={notification.created_at} title={createdAt.toLocaleString()}>
              {timeLabel}
            </time>
            {requestHref && (
              <Link
                href={requestHref}
                className="inline-flex items-center gap-1 font-medium text-cyan hover:text-text"
              >
                View request <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
        {!notification.is_read && (
          <button
            type="button"
            onClick={onMarkAsRead}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-2 rounded-control border border-line px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-cyan/40 hover:text-cyan disabled:cursor-wait disabled:opacity-50"
            aria-label={`Mark "${notification.title}" as read`}
          >
            <Check className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{pending ? 'Saving…' : 'Mark read'}</span>
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-3 pl-[3.25rem] text-sm text-danger">{error}</p>}
    </li>
  )
}
