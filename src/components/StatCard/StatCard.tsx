import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../Card'
import { Typography } from '../Typography'

export interface StatCardProps {
  label: string
  value: string
  subtext?: string
  trend?: {
    value: string
    positive?: boolean
  }
  icon?: ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  subtext,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <Typography variant="caption" className="font-medium text-muted-foreground">
          {label}
        </Typography>
        {icon ? (
          <span className="text-muted-foreground" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <Typography variant="h2" className="text-xl sm:text-2xl font-bold">
        {value}
      </Typography>
      {trend ? (
        <Typography
          variant="caption"
          className={cn(
            'font-medium',
            trend.positive ? 'text-tertiary-600' : 'text-destructive',
          )}
        >
          {trend.value}
        </Typography>
      ) : subtext ? (
        <Typography variant="caption">{subtext}</Typography>
      ) : null}
    </Card>
  )
}
