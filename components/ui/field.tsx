'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

export const inputClass =
  'h-11 w-full rounded-control border border-line bg-surface px-3.5 text-sm text-text placeholder:text-faint transition-colors hover:border-blue/40 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 aria-[invalid=true]:border-danger'

export function Field({
  label, error, hint, children,
}: {
  label: string
  error?: string
  hint?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode
}) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">{label}</label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />
}
