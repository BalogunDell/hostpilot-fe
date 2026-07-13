import { ExternalLink } from 'lucide-react'
import {
  CALENDAR_SYNC_PLATFORM_HELP_TEXT,
  CALENDAR_SYNC_PLATFORM_HELP_URLS,
  CALENDAR_SYNC_PLATFORM_LABELS,
  type CalendarSyncPlatform,
} from '@staypilot/shared'
import { Typography } from './Typography'

interface CalendarPlatformHelpProps {
  platform: CalendarSyncPlatform
}

export function CalendarPlatformHelp({ platform }: CalendarPlatformHelpProps) {
  const label = CALENDAR_SYNC_PLATFORM_LABELS[platform]

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <Typography variant="caption" className="block text-muted-foreground">
        {CALENDAR_SYNC_PLATFORM_HELP_TEXT[platform]}
      </Typography>
      <a
        href={CALENDAR_SYNC_PLATFORM_HELP_URLS[platform]}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
      >
        How to get your {label} iCal link
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  )
}
