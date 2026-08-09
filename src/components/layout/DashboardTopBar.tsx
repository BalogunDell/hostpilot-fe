import { useAuth } from '../../context/AuthContext'
import { useDashboardPeriod } from '../../context/DashboardPeriodContext'
import { useSelectedProperty } from '../../context/SelectedPropertyContext'
import { ProfileSettingsButton } from './ProfileSettingsButton'
import { Select, Typography } from '..'

interface DashboardTopBarProps {
  title: string
}

export function DashboardTopBar({ title }: DashboardTopBarProps) {
  const { selectedMonth, setSelectedMonth, monthOptions } = useDashboardPeriod()
  const {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    propertiesLoading,
  } = useSelectedProperty()
  const { token } = useAuth()

  const propertyOptions = properties.map((property) => ({
    label: property.name,
    value: property.id,
  }))

  return (
    <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border bg-card px-6 py-4 lg:flex">
      <Typography variant="h3" className="min-w-0 shrink truncate">
        {title}
      </Typography>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-1.5">
          <Typography variant="caption" className="shrink-0 text-muted-foreground">
            Property:
          </Typography>
          <div className="w-[11.5rem]">
            <Select
              aria-label="Select property"
              className="h-9 border-0 bg-muted text-sm"
              value={selectedPropertyId ?? ''}
              options={
                propertyOptions.length > 0
                  ? propertyOptions
                  : [{ label: propertiesLoading ? 'Loading…' : 'No properties', value: '' }]
              }
              disabled={!token || propertyOptions.length === 0}
              onChange={(event) => {
                if (event.target.value) setSelectedPropertyId(event.target.value)
              }}
            />
          </div>
        </div>
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
        <ProfileSettingsButton />
      </div>
    </header>
  )
}
