import { forwardRef, type InputHTMLAttributes, useId } from 'react'
import { cn } from '../../lib/cn'
import { Typography } from '../Typography'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const helperId = `${inputId}-helper`
    const errorId = `${inputId}-error`

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="font-label text-sm font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            'flex h-10 w-full min-h-10 rounded-lg border border-input bg-card px-3 py-2 text-body text-foreground transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...props}
        />
        {error ? (
          <Typography
            as="span"
            variant="caption"
            id={errorId}
            className="text-destructive"
          >
            {error}
          </Typography>
        ) : helperText ? (
          <Typography as="span" variant="caption" id={helperId}>
            {helperText}
          </Typography>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
