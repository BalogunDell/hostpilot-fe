import { useDashboardPeriod } from '../../context/DashboardPeriodContext'
import { ProfileSettingsButton } from './ProfileSettingsButton'
import { Select, Typography } from '..'

interface DashboardTopBarProps {
  title: string
}

export function DashboardTopBar({ title }: DashboardTopBarProps) {
  const { selectedMonth, setSelectedMonth, monthOptions } = useDashboardPeriod()

  return (
    <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border bg-card px-6 py-4 lg:flex">
      <div className="flex min-w-0 items-center gap-3">
        <Typography variant="h3" className="shrink-0">
          {title}
        </Typography>
        <div className="flex items-center gap-1.5">
          <Typography variant="caption" className="shrink-0 text-muted-foreground">
            Viewing:
          </Typography>
          <div className="w-[9.75rem]">
            <Select
              aria-label="Select month"
              className="h-9 border-0 bg-muted text-sm"
              value={selectedMonth}
              options={monthOptions}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </div>
        </div>
      </div>

      <ProfileSettingsButton />
    </header>
  )
}
