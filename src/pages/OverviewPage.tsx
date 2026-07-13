import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, isToday, isValid, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { AppLink } from '../context/AppNavigation'
import {
  CALENDAR_SYNC_PLATFORM_LABELS,
  type CalendarSyncPlatform,
} from '@staypilot/shared'
import {
  MoreVertical,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConnectCalendarDialog,
  Dropdown,
  Image,
  OverviewPageSkeleton,
  PlanUpgradeBanner,
  Typography,
} from '../components'
import { buttonVariants } from '../components/Button'
import { useActionsDisabled } from '../context/AppContext'
import {
  downloadPropertyReportPdf,
  formatNaira,
} from '../api/client'
import { PropertyReportViewer } from '../components/PropertyReportViewer'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { PROPERTY_FALLBACK_IMAGE } from '../lib/propertyImages'
import { cn } from '../lib/cn'
interface OverviewData {
  totalRevenue: number
  totalExpenses: number
  monthlyRevenue: number
  previousMonthRevenue: number
  revenueChangePercent: number
  monthlyExpenses: number
  previousMonthExpenses: number
  expenseChangePercent: number
  netProfit: number
  activeBookings: number
  propertyCount: number
  occupancyRate: number
  cashFlow: number
  upcomingCheckIns: Array<{
    id: string
    guestName: string
    propertyName: string
    checkIn: string
  }>
  propertyPerformance: Array<{
    propertyId: string
    name: string
    location: string
    imageUrl: string | null
    revenue: number
    bookingCount: number
    bookedDays: number
    daysInMonth: number
    occupancyRate: number
  }>
}

interface CalendarSync {
  propertyId: string
  platform: CalendarSyncPlatform
  icalUrl: string
}

function formatRevenueChangeLabel(
  percent: number,
  monthlyRevenue: number,
  previousMonthRevenue: number,
) {
  if (monthlyRevenue === 0 && previousMonthRevenue === 0) {
    return null
  }
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent}%`
}

function revenuePerformanceMessage(
  percent: number,
  monthlyRevenue: number,
  previousMonthRevenue: number,
) {
  if (monthlyRevenue === 0 && previousMonthRevenue === 0) {
    return 'Add bookings to start tracking performance.'
  }
  if (percent === 0) {
    return 'Your revenue is flat compared to last month.'
  }
  if (percent > 0) {
    return `Your properties are performing ${percent}% better than last month.`
  }
  return `Your revenue is down ${Math.abs(percent)}% compared to last month.`
}

function formatExpenseChangeLabel(
  percent: number,
  monthlyExpenses: number,
  previousMonthExpenses: number,
  variant: 'long' | 'short' = 'long',
) {
  if (monthlyExpenses === 0 && previousMonthExpenses === 0) {
    return null
  }
  if (percent === 0) {
    return variant === 'short' ? 'Same as last mo' : 'Same as last month'
  }
  const sign = percent > 0 ? '+' : ''
  return variant === 'short'
    ? `${sign}${percent}% vs last mo`
    : `${sign}${percent}% from last month`
}

function expenseChangeTone(percent: number) {
  if (percent < 0) return 'text-tertiary-600'
  if (percent > 0) return 'text-destructive'
  return 'text-muted-foreground'
}

function formatNairaCompact(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k`
  return formatNaira(amount)
}

type BestProperty = OverviewData['propertyPerformance'][number]

function bestPerformerHeadline(property: BestProperty) {
  if (property.revenue > 0) return formatNaira(property.revenue)
  if (property.occupancyRate > 0) return `${property.occupancyRate}% occupancy`
  return '—'
}

function bestPerformerSubtext(property: BestProperty) {
  const daysLabel = `${property.bookedDays} of ${property.daysInMonth} days booked`

  if (property.revenue > 0) {
    return `${property.name} · ${daysLabel}`
  }

  if (property.occupancyRate > 0) {
    return `${property.name} · ${daysLabel}`
  }

  return property.name
}

function guestInitials(name: string | null | undefined) {
  if (!name?.trim()) return '??'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

function parseCheckInDate(value: string | null | undefined) {
  if (!value) return null
  const date = parseISO(value.includes('T') ? value : `${value}T12:00:00`)
  return isValid(date) ? date : null
}

function formatCheckInDate(value: string | null | undefined, pattern: string) {
  const date = parseCheckInDate(value)
  return date ? format(date, pattern) : '—'
}

function PropertyReportActions({
  propertyId,
  propertyName,
  enabled,
}: {
  propertyId: string
  propertyName: string
  enabled: boolean
}) {
  const { token } = useAuth()
  const [loading, setLoading] = useState<'view' | 'download' | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  if (!enabled) {
    return (
      <span className="text-xs text-muted-foreground">
        <a href="/settings#pricing" data-allow-readonly-nav className="text-secondary hover:underline">
          Growth+
        </a>
      </span>
    )
  }

  function handleView() {
    setViewerOpen(true)
  }

  async function handleDownload() {
    setLoading('download')
    try {
      await downloadPropertyReportPdf(propertyId, token)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Dropdown
        align="end"
        trigger={
          <span
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={`Actions for ${propertyName}`}
          >
            <MoreVertical className="size-4" />
          </span>
        }
        items={[
          {
            label: 'View report',
            value: 'view-report',
            onSelect: handleView,
            disabled: loading !== null,
          },
          {
            label: loading === 'download' ? 'Downloading...' : 'Download report',
            value: 'download-report',
            onSelect: handleDownload,
            disabled: loading !== null,
          },
        ]}
      />
      <PropertyReportViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        propertyId={propertyId}
        propertyName={propertyName}
        token={token}
      />
    </>
  )
}

function PropertyCalendarLink({
  propertyId,
  sync,
  onConnect,
  enabled,
}: {
  propertyId: string
  sync?: CalendarSync
  onConnect: (propertyId: string) => void
  enabled: boolean
}) {
  const actionsDisabled = useActionsDisabled()

  if (!enabled) {
    return (
      <span className="text-xs text-muted-foreground">
        <a href="/settings#pricing" data-allow-readonly-nav className="text-secondary hover:underline">
          Growth+
        </a>
      </span>
    )
  }

  if (!sync) {
    return (
      <button
        type="button"
        disabled={actionsDisabled}
        className="text-sm font-medium text-secondary hover:underline disabled:pointer-events-none disabled:opacity-50"
        onClick={() => onConnect(propertyId)}
      >
        Connect calendar
      </button>
    )
  }

  return (
    <a
      href={sync.icalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-secondary hover:underline"
    >
      {CALENDAR_SYNC_PLATFORM_LABELS[sync.platform]}
    </a>
  )
}

export function OverviewPage() {
  const api = useApi()
  const { token, user } = useAuth()
  const { hasCalendarSync, hasMonthlyReports, hasPropertyComparison } = usePlanFeatures()
  const queryClient = useQueryClient()
  const [connectCalendarOpen, setConnectCalendarOpen] = useState(false)
  const [connectPropertyId, setConnectPropertyId] = useState<string | undefined>()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api<OverviewData>('/dashboard/overview'),
    enabled: Boolean(token),
  })

  const { data: syncsData } = useQuery({
    queryKey: ['calendar-syncs'],
    queryFn: () => api<{ syncs: CalendarSync[] }>('/calendar-sync'),
    enabled: Boolean(token),
  })

  const syncByPropertyId = useMemo(() => {
    const map = new Map<string, CalendarSync>()
    for (const sync of syncsData?.syncs ?? []) {
      map.set(sync.propertyId, sync)
    }
    return map
  }, [syncsData?.syncs])

  function openConnectCalendar(propertyId: string) {
    if (!hasCalendarSync) return
    setConnectPropertyId(propertyId)
    setConnectCalendarOpen(true)
  }

  function closeConnectCalendar() {
    setConnectCalendarOpen(false)
    setConnectPropertyId(undefined)
  }

  if (isLoading) {
    return <OverviewPageSkeleton />
  }

  if (isError) {
    return (
      <Typography className="text-destructive">
        {error instanceof Error ? error.message : 'Failed to load overview'}
      </Typography>
    )
  }

  if (!data) return null

  const firstName = user?.name?.split(' ')[0] ?? 'Pilot'
  const upcomingCheckIns = data.upcomingCheckIns ?? []
  const propertyPerformance = data.propertyPerformance ?? []
  const checkInsToday = upcomingCheckIns.filter((checkIn) => {
    const date = parseCheckInDate(checkIn.checkIn)
    return date ? isToday(date) : false
  }).length

  const expenseChangeLabel = formatExpenseChangeLabel(
    data.expenseChangePercent,
    data.monthlyExpenses,
    data.previousMonthExpenses,
  )
  const expenseChangeLabelShort = formatExpenseChangeLabel(
    data.expenseChangePercent,
    data.monthlyExpenses,
    data.previousMonthExpenses,
    'short',
  )
  const revenueChangeLabel = formatRevenueChangeLabel(
    data.revenueChangePercent,
    data.monthlyRevenue,
    data.previousMonthRevenue,
  )
  const revenuePerformanceText = revenuePerformanceMessage(
    data.revenueChangePercent,
    data.monthlyRevenue,
    data.previousMonthRevenue,
  )
  const expenseTrendUp = data.expenseChangePercent > 0
  const ExpenseTrendIcon = expenseTrendUp ? TrendingUp : TrendingDown

  const bestProperty = propertyPerformance.reduce<
    OverviewData['propertyPerformance'][number] | null
  >((best, property) => {
    if (!best) return property
    if (property.revenue !== best.revenue) {
      return property.revenue > best.revenue ? property : best
    }
    return property.occupancyRate > best.occupancyRate ? property : best
  }, null)

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {/* ── Mobile greeting ── */}
      <div className="lg:hidden">
        <Typography variant="h2" className="text-2xl">
          Good Morning, {firstName}
        </Typography>
        <Typography variant="caption" className="mt-1 block text-base text-muted-foreground">
          Here is what&apos;s happening with your properties today.
        </Typography>
      </div>

      {/* ── Mobile stats ── */}
      <div className="flex flex-col gap-3 lg:hidden">
        <Card className="relative flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between">
            <Typography variant="caption" className="font-semibold text-muted-foreground">
              Total earnings
            </Typography>
            {revenueChangeLabel ? (
              <Badge
                variant={data.revenueChangePercent >= 0 ? 'success' : 'warning'}
                className="shrink-0"
              >
                {revenueChangeLabel}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-end justify-between gap-2">
            <Typography variant="h2" className="text-2xl font-bold">
              {formatNaira(data.totalRevenue)}
            </Typography>
            <Wallet className="size-5 text-secondary" aria-hidden />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col gap-1 p-4">
            <Typography variant="caption" className="font-medium text-muted-foreground">
              Total expenses
            </Typography>
            <Typography variant="h3" className="text-xl font-bold">
              {formatNairaCompact(data.monthlyExpenses)}
            </Typography>
            {expenseChangeLabelShort ? (
              <Typography
                variant="caption"
                className={expenseChangeTone(data.expenseChangePercent)}
              >
                {expenseTrendUp ? '↗' : data.expenseChangePercent < 0 ? '↘' : '→'}{' '}
                {expenseChangeLabelShort}
              </Typography>
            ) : null}
          </Card>
          <Card className="flex flex-col gap-1 p-4">
            <Typography variant="caption" className="font-medium text-muted-foreground">
              Best performer
            </Typography>
            {bestProperty ? (
              <>
                <Typography variant="h3" className="text-xl font-bold">
                  {bestPerformerHeadline(bestProperty)}
                </Typography>
                <Typography variant="caption" className="truncate text-muted-foreground">
                  {bestPerformerSubtext(bestProperty)}
                </Typography>
              </>
            ) : (
              <Typography variant="h3" className="text-xl font-bold">
                —
              </Typography>
            )}
          </Card>
        </div>
      </div>

      {/* ── Desktop stats ── */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        <Card className="flex flex-col gap-3 border-0 bg-primary-900 p-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-2">
            <Typography variant="caption" className="font-medium text-primary-foreground/70">
              Total earnings
            </Typography>
            <Wallet className="size-5 text-tertiary" aria-hidden />
          </div>
          <Typography variant="h2" className="text-3xl font-bold text-primary-foreground">
            {formatNaira(data.totalRevenue)}
          </Typography>
          <Typography variant="caption" className="font-medium text-tertiary">
            Net Profit: {formatNaira(data.netProfit)}
          </Typography>
        </Card>

        <Card className="flex flex-col gap-3 p-6">
          <div className="flex items-start justify-between gap-2">
            <Typography variant="caption" className="font-medium">
              Total expenses
            </Typography>
            {expenseChangeLabel ? (
              <ExpenseTrendIcon
                className={cn(
                  'size-5',
                  expenseTrendUp ? 'text-destructive' : 'text-tertiary-600',
                )}
                aria-hidden
              />
            ) : (
              <TrendingDown className="size-5 text-muted-foreground" aria-hidden />
            )}
          </div>
          <Typography variant="h2" className="text-3xl font-bold">
            {formatNaira(data.monthlyExpenses)}
          </Typography>
          {expenseChangeLabel ? (
            <Typography
              variant="caption"
              className={cn('font-medium', expenseChangeTone(data.expenseChangePercent))}
            >
              {expenseChangeLabel}
            </Typography>
          ) : (
            <Typography variant="caption" className="font-medium text-muted-foreground">
              No expenses this month
            </Typography>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-6">
          <div className="flex items-start justify-between gap-2">
            <Typography variant="caption" className="font-medium">
              Best performer
            </Typography>
            <Sparkles className="size-5 text-secondary" aria-hidden />
          </div>
          {bestProperty ? (
            <>
              <Typography variant="h2" className="text-3xl font-bold">
                {bestPerformerHeadline(bestProperty)}
              </Typography>
              <Typography variant="caption" className="font-medium text-muted-foreground">
                {bestPerformerSubtext(bestProperty)}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h2" className="text-3xl font-bold">
                —
              </Typography>
              <Typography variant="caption" className="text-muted-foreground">
                Add a property to see your top performer
              </Typography>
            </>
          )}
        </Card>
      </div>

      {/* ── Desktop welcome + check-ins ── */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        <Card
          padding="md"
          className="relative overflow-hidden border-secondary-100 bg-secondary-50 lg:col-span-2 dark:bg-secondary/10"
        >
          <Sparkles className="pointer-events-none absolute -right-2 top-4 size-16 text-secondary/20" aria-hidden />
          <div className="relative flex flex-col gap-4">
            <Typography variant="h3">Welcome back, {firstName}!</Typography>
            <Typography variant="body" className="max-w-xl text-muted-foreground">
              {revenuePerformanceText}
              {checkInsToday > 0
                ? ` You have ${checkInsToday} check-in${checkInsToday === 1 ? '' : 's'} scheduled for today.`
                : ' No check-ins scheduled for today yet.'}
            </Typography>
            <div className="flex flex-row gap-2">
              <AppLink to="/bookings" className={buttonVariants()}>
                View All Bookings
              </AppLink>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Check-ins</CardTitle>
            {checkInsToday > 0 ? <Badge variant="info">TODAY</Badge> : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            {upcomingCheckIns.length === 0 ? (
              <Typography variant="caption">No upcoming check-ins</Typography>
            ) : (
              upcomingCheckIns.slice(0, 3).map((checkIn) => (
                  <div key={checkIn.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Typography variant="label">{checkIn.guestName ?? 'Guest'}</Typography>
                      <Typography variant="caption">{formatCheckInDate(checkIn.checkIn, 'MMM d')}</Typography>
                    </div>
                    <Typography variant="caption" className="mt-1 block">
                      {checkIn.propertyName}
                    </Typography>
                  </div>
              ))
            )}
            <AppLink to="/calendar" className="mt-1 text-center text-sm font-medium text-secondary hover:underline">
              View Calendar
            </AppLink>
          </CardContent>
        </Card>
      </div>

      {/* ── Mobile check-ins ── */}
      <section className="lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <Typography variant="h4">Upcoming Check-ins</Typography>
          <AppLink to="/calendar" className="text-sm font-medium text-secondary hover:underline">
            See all
          </AppLink>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingCheckIns.length === 0 ? (
            <Card padding="md">
              <Typography variant="caption">No upcoming check-ins</Typography>
            </Card>
          ) : (
            upcomingCheckIns.slice(0, 2).map((checkIn) => (
              <Card key={checkIn.id} padding="md" className="flex flex-row items-center gap-3">
                <Avatar
                  alt={checkIn.guestName ?? 'Guest'}
                  fallback={guestInitials(checkIn.guestName)}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <Typography variant="label">{checkIn.guestName ?? 'Guest'}</Typography>
                  <Typography variant="caption" className="block truncate">
                    {checkIn.propertyName} · {formatCheckInDate(checkIn.checkIn, 'EEE, MMM d')}
                  </Typography>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* ── Property Performance ── */}
      <section>
        {!hasPropertyComparison ? (
          <PlanUpgradeBanner
            requiredPlan="GROWTH"
            feature="Property performance comparison"
            className="mb-4"
          />
        ) : null}

        <Card padding="md" className="hidden lg:block">
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Property</th>
                    {hasPropertyComparison ? (
                      <th className="pb-3 pr-4 font-medium">Linked calendar</th>
                    ) : null}
                    <th className="pb-3 pr-4 font-medium">Monthly Revenue</th>
                    {hasPropertyComparison ? (
                      <th className="w-28 pb-3 pr-4 font-medium">Occupancy</th>
                    ) : null}
                    {hasMonthlyReports ? (
                      <th className="pb-3 text-right font-medium">Action</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {propertyPerformance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          1 +
                          (hasPropertyComparison ? 2 : 0) +
                          (hasMonthlyReports ? 1 : 0)
                        }
                        className="py-8 text-center text-muted-foreground"
                      >
                        No properties yet. Add your first property to get started.
                      </td>
                    </tr>
                  ) : (
                    propertyPerformance.map((property) => (
                        <tr key={property.propertyId} className="border-b border-border last:border-0">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image
                                  src={property.imageUrl ?? PROPERTY_FALLBACK_IMAGE}
                                  alt={property.name}
                                  className="size-12 object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <Typography variant="label">{property.name}</Typography>
                                <Typography variant="caption" className="block truncate">
                                  {property.location}
                                </Typography>
                              </div>
                            </div>
                          </td>
                          {hasPropertyComparison ? (
                            <td className="py-4 pr-4">
                              <PropertyCalendarLink
                                propertyId={property.propertyId}
                                sync={syncByPropertyId.get(property.propertyId)}
                                onConnect={openConnectCalendar}
                                enabled={hasCalendarSync}
                              />
                            </td>
                          ) : null}
                          <td className="py-4 pr-4">
                            <Typography variant="label">{formatNaira(property.revenue)}</Typography>
                          </td>
                          {hasPropertyComparison ? (
                            <td className="w-28 py-4 pr-4">
                              <Typography variant="label" className="tabular-nums">
                                {property.occupancyRate}%
                              </Typography>
                            </td>
                          ) : null}
                          {hasMonthlyReports ? (
                            <td className="py-4 text-right">
                              <PropertyReportActions
                                propertyId={property.propertyId}
                                propertyName={property.name}
                                enabled={hasMonthlyReports}
                              />
                            </td>
                          ) : null}
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile property performance */}
        <div className="flex flex-col gap-4 lg:hidden">
          <Typography variant="h4">Property Performance</Typography>
          {propertyPerformance.length === 0 ? (
            <Card padding="md">
              <Typography variant="caption">No properties yet.</Typography>
            </Card>
          ) : (
            propertyPerformance.map((property) => (
                <Card key={property.propertyId} padding="md">
                  <div className="flex items-start gap-3">
                    <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={property.imageUrl ?? PROPERTY_FALLBACK_IMAGE}
                        alt={property.name}
                        className="size-14 object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Typography variant="label">{property.name}</Typography>
                          <Typography variant="caption" className="block truncate">
                            {property.location}
                          </Typography>
                        </div>
                        {hasMonthlyReports ? (
                          <PropertyReportActions
                            propertyId={property.propertyId}
                            propertyName={property.name}
                            enabled={hasMonthlyReports}
                          />
                        ) : null}
                      </div>
                      {hasPropertyComparison ? (
                        <div className="mt-2">
                          <PropertyCalendarLink
                            propertyId={property.propertyId}
                            sync={syncByPropertyId.get(property.propertyId)}
                            onConnect={openConnectCalendar}
                            enabled={hasCalendarSync}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Typography variant="caption" className="text-muted-foreground">
                        Monthly Revenue
                      </Typography>
                      <Typography variant="label" className="mt-0.5 block">
                        {formatNaira(property.revenue)}
                      </Typography>
                    </div>
                    {hasPropertyComparison ? (
                      <div>
                        <Typography variant="caption" className="text-muted-foreground">
                          Occupancy
                        </Typography>
                        <Typography variant="label" className="mt-0.5 block tabular-nums">
                          {property.occupancyRate}%
                        </Typography>
                      </div>
                    ) : null}
                  </div>
                </Card>
              ))
          )}
        </div>
      </section>

      <ConnectCalendarDialog
        open={connectCalendarOpen}
        onClose={closeConnectCalendar}
        initialPropertyId={connectPropertyId}
        onConnected={() => {
          queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] })
        }}
      />
    </div>
  )
}
