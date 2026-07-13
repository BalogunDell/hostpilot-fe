import { forwardRef, type InputHTMLAttributes, useId } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  indeterminate?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, indeterminate, checked, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id ?? generatedId

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex min-h-11 cursor-pointer items-center gap-3',
          props.disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
          <input
            ref={(node) => {
              if (node) node.indeterminate = indeterminate ?? false
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-sm border border-input bg-card transition-colors',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
              (checked || indeterminate) && 'border-secondary bg-secondary',
            )}
            aria-hidden
          >
            {indeterminate ? (
              <Minus className="size-3 text-white" />
            ) : checked ? (
              <Check className="size-3 text-white" />
            ) : null}
          </span>
        </span>
        <span className="font-body text-body text-foreground">{label}</span>
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
