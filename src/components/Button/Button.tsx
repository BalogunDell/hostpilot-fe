import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { cn } from '../../lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-800',
        secondary: 'bg-muted text-foreground hover:bg-primary-200 dark:hover:bg-primary-700',
        inverted:
          'bg-primary-900 text-primary-foreground hover:bg-primary-800',
        outlined:
          'border border-border bg-transparent text-foreground hover:bg-accent',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        tertiary: 'bg-tertiary text-tertiary-foreground hover:bg-tertiary-600',
      },
      size: {
        sm: 'h-9 min-h-9 px-3 text-sm rounded-md',
        md: 'h-10 min-h-10 px-4 text-body rounded-lg',
        lg: 'h-11 min-h-11 px-6 text-body rounded-lg',
        icon: 'size-10 min-h-10 min-w-10 rounded-lg',
        'icon-sm': 'size-9 min-h-9 min-w-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>['variant']
>
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>['size']
>

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  /** Keep enabled when the account is read-only (e.g. layout chrome). */
  allowWhenReadOnly?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabled,
      allowWhenReadOnly = false,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const { actionsDisabled } = useApp()
    const isDisabled =
      (disabled ?? false) ||
      loading ||
      (actionsDisabled && !allowWhenReadOnly)

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span className="sr-only">Loading</span>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { buttonVariants }
