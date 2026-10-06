import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue text-ink hover:bg-cyan',
        secondary: 'border border-line bg-raised text-text hover:border-blue/50',
        ghost: 'text-muted hover:bg-raised hover:text-text',
        danger: 'border border-danger/40 text-danger hover:bg-danger/10',
      },
      size: { md: 'h-11 px-4 text-sm', sm: 'h-9 px-3 text-sm' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { loading?: boolean }

export function Button({ className, variant, size, loading, children, disabled, ...rest }: Props) {
  return (
    <button className={cn(button({ variant, size }), className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
