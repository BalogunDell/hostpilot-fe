import { cn } from '../../lib/cn'

export interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  className?: string
  barClassName?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  className,
  barClassName,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <span className="text-sm text-muted-foreground">{label}</span>
          ) : (
            <span />
          )}
          {showValue ? (
            <span className="text-sm font-medium text-foreground">
              {Math.round(percentage)}%
            </span>
          ) : null}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full bg-secondary transition-all duration-300',
            barClassName,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
