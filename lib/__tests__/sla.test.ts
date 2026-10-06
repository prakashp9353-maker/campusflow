import { describe, expect, it } from 'vitest'
import { averageResolutionHours, computeDueAt, formatCountdown, getSlaState } from '../sla'

const t0 = new Date('2026-10-06T08:00:00Z')

describe('SLA', () => {
  it('uses 4/12/24/72 hour windows', () => {
    expect(computeDueAt(t0, 'critical').toISOString()).toBe('2026-10-06T12:00:00.000Z')
    expect(computeDueAt(t0, 'high').toISOString()).toBe('2026-10-06T20:00:00.000Z')
    expect(computeDueAt(t0, 'medium').toISOString()).toBe('2026-10-07T08:00:00.000Z')
    expect(computeDueAt(t0, 'low').toISOString()).toBe('2026-10-09T08:00:00.000Z')
  })

  it('classifies on_track, warning, overdue and closed', () => {
    const dueAt = computeDueAt(t0, 'high') // 12h window
    const base = { createdAt: t0, dueAt, status: 'in_progress' as const }
    expect(getSlaState({ ...base, now: new Date('2026-10-06T10:00:00Z') })).toBe('on_track')
    expect(getSlaState({ ...base, now: new Date('2026-10-06T18:00:00Z') })).toBe('warning')
    expect(getSlaState({ ...base, now: new Date('2026-10-06T20:00:00Z') })).toBe('overdue')
    expect(getSlaState({ ...base, status: 'completed', now: new Date('2026-10-07T20:00:00Z') })).toBe('closed')
  })

  it('formats countdowns including overdue time', () => {
    expect(formatCountdown(3_723_000)).toBe('01:02:03')
    expect(formatCountdown(-61_000)).toBe('-00:01:01')
  })

  it('averages resolution time and returns null when empty', () => {
    expect(averageResolutionHours([])).toBeNull()
    expect(
      averageResolutionHours([
        { createdAt: t0, completedAt: new Date('2026-10-06T10:00:00Z') },
        { createdAt: t0, completedAt: new Date('2026-10-06T14:00:00Z') },
      ]),
    ).toBe(4)
  })
})
