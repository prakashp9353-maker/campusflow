'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { establishTabSession } from '@/lib/tab-session'

export default function AuthCompletePage() {
  const router = useRouter()

  useEffect(() => {
    establishTabSession()
    router.replace('/')
  }, [router])

  return (
    <main className="grid min-h-screen place-items-center text-sm text-muted">
      Completing sign-in…
    </main>
  )
}
