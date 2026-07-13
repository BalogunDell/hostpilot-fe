import type { ReactNode } from 'react'
import { Typography } from '../Typography'
import { cn } from '../../lib/cn'

interface SettingsSectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsSection({
  id,
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-28 border-t border-border pt-10 first:border-t-0 first:pt-0',
        className,
      )}
    >
      <Typography variant="h3">{title}</Typography>
      {description ? (
        <Typography variant="caption" className="mt-1 block text-muted-foreground">
          {description}
        </Typography>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  )
}
