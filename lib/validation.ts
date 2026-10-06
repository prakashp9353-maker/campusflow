import { z } from 'zod'
import { DEPARTMENT_OPTIONS, SEMESTER_OPTIONS } from './constants'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter your college email.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(80),
    studentId: z
      .string()
      .trim()
      .min(3, 'Enter your student ID.')
      .max(30)
      .regex(/^[A-Za-z0-9\-/]+$/, 'Use letters, numbers, hyphens or slashes only.'),
    email: z.string().trim().toLowerCase().email('Enter a valid college email.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .regex(/[A-Za-z]/, 'Include at least one letter.')
      .regex(/\d/, 'Include at least one number.'),
    confirmPassword: z.string(),
    department: z.enum(DEPARTMENT_OPTIONS.map((d) => d.value) as [string, ...string[]], {
      message: 'Select your department.',
    }),
    semester: z.enum(SEMESTER_OPTIONS.map((s) => s.value) as [string, ...string[]], {
      message: 'Select your semester.',
    }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

/** Collapses zod issues into one message per field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
