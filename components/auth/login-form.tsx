'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { signIn } from '@/lib/auth'
import { establishTabSession } from '@/lib/tab-session'
import { fieldErrors, loginSchema } from '@/lib/validation'

export function LoginForm() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)))
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setBusy(true)
    try {
      const { role } = await signIn(parsed.data)
      establishTabSession()
      router.replace(`/${role}/dashboard`)
      router.refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label="College email" error={errors.email}>
        {(p) => <TextInput {...p} name="email" type="email" autoComplete="username" />}
      </Field>
      <Field label="Password" error={errors.password}>
        {(p) => (
          <div className="relative">
            <TextInput {...p} name="password" type={show ? 'text' : 'password'} autoComplete="current-password" className="pr-11" />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-faint hover:text-text"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
      </Field>
      {formError && <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">{formError}</p>}
      <Button type="submit" loading={busy}>Sign in</Button>
    </form>
  )
}
