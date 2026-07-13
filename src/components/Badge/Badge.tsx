import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground',
        success: 'bg-tertiary-50 text-tertiary-600 dark:bg-tertiary-600/20 dark:text-tertiary-100',
        warning: 'bg-warning-50 text-warning dark:bg-warning/20',
        destructive:
          'bg-destructive-50 text-destructive dark:bg-destructive/20',
        info: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-600/20 dark:text-secondary-100',
        outline: 'border border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

export function StatusDot({
  variant = 'default',
  className,
}: {
  variant?: 'success' | 'warning' | 'destructive' | 'default'
  className?: string
}) {
  const colors = {
    success: 'bg-tertiary',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    default: 'bg-muted-foreground',
  } as const

  return (
    <span
      className={cn('size-2 shrink-0 rounded-full', colors[variant], className)}
      aria-hidden
    />
  )
}
