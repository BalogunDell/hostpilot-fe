import { AppLink } from '../context/AppNavigation'
import { AlertTriangle } from 'lucide-react'
import { buttonVariants } from './Button/Button'
import { Typography } from './Typography/Typography'
import { cn } from '../lib/cn'

export function ReadOnlyBanner() {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between lg:px-6"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <Typography
            variant="label"
            className="block text-amber-950 dark:text-amber-100"
          >
            Your paid subscription has expired
          </Typography>
          <Typography
            variant="caption"
            className="mt-0.5 block leading-snug text-amber-800 dark:text-amber-200/80"
          >
            You can browse your data, but changes are disabled until you renew.
          </Typography>
        </div>
      </div>
      <AppLink
        to="/settings#pricing"
        allowWhenReadOnly
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'shrink-0')}
      >
        Renew plan
      </AppLink>
    </div>
  )
}
