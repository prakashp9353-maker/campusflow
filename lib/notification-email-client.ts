'use client'

export async function dispatchRequestEmails(requestId: string, eventAt: string): Promise<boolean> {
  try {
    const response = await fetch('/api/email/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, eventAt }),
      signal: AbortSignal.timeout(6_000),
    })
    if (!response.ok) return false

    const result: unknown = await response.json()
    if (typeof result !== 'object' || result === null) return false
    const dispatchResult = result as { sent?: unknown; skipped?: unknown; success?: unknown }
    return dispatchResult.success === true
      && dispatchResult.skipped !== true
      && typeof dispatchResult.sent === 'number'
      && dispatchResult.sent > 0
  } catch {
    return false
  }
}
