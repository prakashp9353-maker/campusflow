import { cva } from 'class-variance-authority'

/** Class names that make a <Link> look like a Button. */
export const buttonLink = cva(
  'inline-flex h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue text-ink hover:bg-cyan',
        secondary: 'border border-line bg-raised text-text hover:border-blue/50',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)
