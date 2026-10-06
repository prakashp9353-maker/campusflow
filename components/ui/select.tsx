'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { inputClass } from './field'

export type Option = { value: string; label: string }

type Props = {
  id?: string
  options: readonly Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  invalid?: boolean
  'aria-describedby'?: string
}

/** Accessible custom dropdown (listbox pattern) used in place of native selects. */
export function Select({ id, options, value, onChange, placeholder, invalid, ...aria }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }
  function choose(i: number) {
    onChange(options[i].value)
    setOpen(false)
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList() }
      return
    }
    if (e.key === 'Escape') { setOpen(false) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Tab') { setOpen(false) }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-invalid={invalid}
        {...aria}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(inputClass, 'flex items-center justify-between text-left', !selected && 'text-faint')}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-faint transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-control border border-line bg-raised p-1 shadow-2xl shadow-black/50"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(i) }}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm',
                i === active ? 'bg-blue/15 text-text' : 'text-muted',
              )}
            >
              <span>{o.label}</span>
              {o.value === value && <Check className="size-4 text-cyan" aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
