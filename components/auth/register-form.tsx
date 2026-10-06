'use client'

import { MailCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { registerStudent } from '@/lib/auth'
import { establishTabSession } from '@/lib/tab-session'
import { DEPARTMENT_OPTIONS, SEMESTER_OPTIONS } from '@/lib/constants'
import { fieldErrors, registerSchema } from '@/lib/validation'

export function RegisterForm() {
  const router = useRouter()
  const [sentTo, setSentTo] = useState('')
  const [department, setDepartment] = useState('')
  const [semester, setSemester] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')
    const data = { ...Object.fromEntries(new FormData(e.currentTarget)), department, semester }
    const parsed = registerSchema.safeParse(data)
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setBusy(true)
    try {
      const result = await registerStudent(parsed.data)
      if (result.needsConfirmation) setSentTo(parsed.data.email)
      else {
        establishTabSession()
        router.replace('/student/dashboard')
        router.refresh()
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-control border border-ok/30 bg-ok/10 px-5 py-8 text-center">
        <MailCheck className="size-8 text-ok" aria-hidden />
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-muted">We sent a confirmation link to {sentTo}. Open it to activate your account, then sign in.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Full name" error={errors.fullName}>
        {(p) => <TextInput {...p} name="fullName" autoComplete="name" />}
      </Field>
      <Field label="Student ID" error={errors.studentId}>
        {(p) => <TextInput {...p} name="studentId" autoComplete="off" />}
      </Field>
      <Field label="College email" error={errors.email}>
        {(p) => <TextInput {...p} name="email" type="email" autoComplete="email" />}
      </Field>
      <Field label="Department" error={errors.department}>
        {(p) => (
          <Select id={p.id} aria-describedby={p['aria-describedby']} invalid={p['aria-invalid']}
            options={DEPARTMENT_OPTIONS} value={department} onChange={setDepartment} placeholder="Select your department" />
        )}
      </Field>
      <Field label="Semester" error={errors.semester}>
        {(p) => (
          <Select id={p.id} aria-describedby={p['aria-describedby']} invalid={p['aria-invalid']}
            options={SEMESTER_OPTIONS} value={semester} onChange={setSemester} placeholder="Select your semester" />
        )}
      </Field>
      <Field label="Password" error={errors.password} hint="At least 8 characters with a letter and a number.">
        {(p) => <TextInput {...p} name="password" type="password" autoComplete="new-password" />}
      </Field>
      <Field label="Confirm password" error={errors.confirmPassword}>
        {(p) => <TextInput {...p} name="confirmPassword" type="password" autoComplete="new-password" />}
      </Field>
      {formError && <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">{formError}</p>}
      <Button type="submit" loading={busy}>Create account</Button>
    </form>
  )
}
