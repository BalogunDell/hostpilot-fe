import { Bell, HelpCircle } from 'lucide-react'
import { Button, SearchInput, Typography } from '..'
import { LogoutButton } from './LogoutButton'
import { ProfileSettingsButton } from './ProfileSettingsButton'

interface DashboardTopBarProps {
  title: string
  searchPlaceholder?: string
  showSearch?: boolean
}

export function DashboardTopBar({
  title,
  searchPlaceholder = 'Search...',
  showSearch = true,
}: DashboardTopBarProps) {
  return (
    <header className="sticky top-0 z-30 hidden items-center gap-6 border-b border-border bg-card px-6 py-4 lg:flex">
      <Typography variant="h3" className="shrink-0">
        {title}
      </Typography>

      {showSearch ? (
        <div className="mx-auto w-full max-w-xl flex-1">
          <SearchInput
            placeholder={searchPlaceholder}
            className="border-0 bg-muted"
          />
        </div>
      ) : (
        <div className="flex-1" aria-hidden />
      )}

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-5" />
          <span
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive"
            aria-hidden
          />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Help">
          <HelpCircle className="size-5" />
        </Button>
        <div className="mx-1 h-8 w-px bg-border" aria-hidden />
        <LogoutButton />
        <ProfileSettingsButton className="pl-1" />
      </div>
    </header>
  )
}
