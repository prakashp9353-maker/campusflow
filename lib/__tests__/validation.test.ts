import { describe, expect, it } from 'vitest'
import { fieldErrors, registerSchema } from '../validation'

const valid = {
  fullName: 'Test Student', studentId: 'STU-001', email: 'Test@College.edu',
  password: 'abcd1234', confirmPassword: 'abcd1234', department: 'CSE', semester: '5',
}

describe('registerSchema', () => {
  it('accepts valid input and lowercases the email', () => {
    const r = registerSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('test@college.edu')
  })
  it('rejects mismatched passwords and bad department', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'x', department: 'MECH' })
    expect(r.success).toBe(false)
    if (!r.success) {
      const errs = fieldErrors(r.error)
      expect(errs.department).toBeTruthy()
    }
  })
  it('reports password mismatch on confirmPassword', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'different1' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).confirmPassword).toBe('Passwords do not match.')
  })
})
