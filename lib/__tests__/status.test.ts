import { describe, expect, it } from 'vitest'
import { canTransition, nextStatuses } from '../status'
import { formatRequestId, isRequestId } from '../request-id'

describe('status workflow', () => {
  it('allows the forward path for staff', () => {
    expect(canTransition('staff', 'assigned', 'in_progress')).toBe(true)
    expect(canTransition('staff', 'in_progress', 'completed')).toBe(true)
  })
  it('blocks skipping steps', () => {
    expect(canTransition('admin', 'pending', 'completed')).toBe(false)
    expect(canTransition('admin', 'pending', 'in_progress')).toBe(false)
  })
  it('blocks students and staff from assignment', () => {
    expect(canTransition('student', 'assigned', 'in_progress')).toBe(false)
    expect(canTransition('staff', 'pending', 'assigned')).toBe(false)
    expect(canTransition('admin', 'pending', 'assigned')).toBe(true)
  })
  it('treats completed as terminal', () => {
    expect(nextStatuses('admin', 'completed')).toEqual([])
  })
})

describe('request ids', () => {
  it('formats and validates', () => {
    expect(formatRequestId(10241)).toBe('CF-10241')
    expect(isRequestId('CF-10241')).toBe(true)
    expect(isRequestId('CF-12')).toBe(false)
  })
})
