'use client'

import { LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/logo'
import { signOut } from '@/lib/auth'
import { NAV } from '@/lib/navigation'
import { TAB_SESSION_KEY } from '@/lib/tab-session'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/types'

const ROLE_LABEL: Record<AppRole, string> = { student: 'Student', admin: 'Campus Manager' }

export function AppShell({
  role, user, unreadNotificationCount, children,
}: {
  role: AppRole
  user: { fullName: string; email: string }
  unreadNotificationCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tabSessionActive, setTabSessionActive] = useState(false)
  const items = NAV[role].map((item) => ({
    ...item,
    href: `/${role}/${item.slug}`,
  }))

  // The most specific matching link wins, so /student/requests/new does not also light up My Requests.
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    try {
      if (sessionStorage.getItem(TAB_SESSION_KEY)) {
        setTabSessionActive(true)
        return
      }
    } catch {
      // Without tab storage, fail closed and require an explicit sign-in.
    }

    router.replace('/login')
  }, [router])

  if (!tabSessionActive) return null

  return (
    <div className="ambient relative flex min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface/95 px-4 py-6 backdrop-blur transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-2 pb-8">
          <Logo />
          <button className="rounded-lg p-2 text-muted hover:text-text lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={href === activeHref ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors',
                href === activeHref ? 'bg-blue/15 text-text' : 'text-muted hover:bg-raised hover:text-text',
              )}
            >
              <Icon className={cn('size-[18px]', href === activeHref && 'text-cyan')} aria-hidden />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                {label}
                {href === `/${role}/notifications` && unreadNotificationCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cyan/15 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-cyan">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    <span className="sr-only">
                      {` ${unreadNotificationCount} unread ${unreadNotificationCount === 1 ? 'notification' : 'notifications'}`}
                    </span>
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-line pt-5">
          <div className="px-2">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-faint">{ROLE_LABEL[role]} · {user.email}</p>
          </div>
          <button
            onClick={async () => {
              sessionStorage.removeItem(TAB_SESSION_KEY)
              await signOut()
              router.replace('/login')
              router.refresh()
            }}
            className="mt-3 flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm text-muted transition-colors hover:bg-raised hover:text-text"
          >
            <LogOut className="size-[18px]" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu" />}

      <div className="relative z-10 min-w-0 flex-1">
        <header className="flex h-16 items-center border-b border-line px-5 lg:hidden">
          <button className="-ml-2 rounded-lg p-2 text-muted hover:text-text" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  )
}
