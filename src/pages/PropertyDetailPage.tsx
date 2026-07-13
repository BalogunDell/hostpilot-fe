import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import {
  Copy,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import {
  AddExpenseDialog,
  Badge,
  Button,
  CalendarPlatformHelp,
  Card,
  CopyExpensesDialog,
  Dialog,
  Input,
  PlanUpgradeBanner,
  ProgressBar,
  PropertyDetailPageSkeleton,
  Select,
  StatusDot,
  Typography,
} from '../components'
import { PropertyReportViewer } from '../components/PropertyReportViewer'
import { PropertyReviewsSection } from '../components/PropertyReviewsSection'
import {
  apiRequestPaginated,
  formatNaira,
} from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useActionsDisabled } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { cn } from '../lib/cn'
import {
  CALENDAR_SYNC_PLATFORM_LABELS,
  type CalendarSyncPlatform,
} from '@staypilot/shared'
import {
  EXPENSE_CATEGORIES,
  listingHealthLabel,
  listingHealthMessage,
  listingHealthScore,
  propertyStatus,
} from '../lib/propertyMetrics'

interface Property {
  id: string
  name: string
  location: string
  nightlyRate: number | null
  description: string | null
  imageUrls: string[]
}

interface Expense {
  id: string
  propertyId: string
  category: string
  description: string | null
  amount: number
  expenseDate: string
}

interface PropertyDashboard {
  performance: {
    propertyId: string
    revenue: number
    bookingCount: number
    occupancyRate: number
    monthlyExpenses: number
  }
  trends: Array<{ month: string; revenue: number; expenses: number }>
  previousMonthRevenue: number
  revenueChangePercent: number
}

function PropertyMetricCard({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card padding="md" className={cn('flex flex-col gap-2.5', className)}>
      <Typography
        variant="caption"
        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
      >
        {label}
      </Typography>
      {children}
    </Card>
  )
}

const expenseFieldClassName = 'border-border/70 bg-muted/50 shadow-none'

function PropertyStatusBadge({
  occupancy,
  revenue,
}: {
  occupancy: number
  revenue: number
}) {
  const status = propertyStatus(occupancy, revenue)

  if (status === 'maintenance') {
    return (
      <Badge variant="outline" className="gap-1.5 border-border bg-card">
        <StatusDot variant="destructive" />
        Maintenance
      </Badge>
    )
  }

  if (status === 'occupied') {
    return (
      <Badge variant="info" className="gap-1.5">
        <StatusDot variant="success" />
        Occupied
      </Badge>
    )
  }

  return (
    <Badge variant="success" className="gap-1.5">
      <StatusDot variant="success" />
      Active
    </Badge>
  )
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const api = useApi()
  const { token } = useAuth()
  const { hasCalendarSync, hasMonthlyReports, hasProfitSummary } = usePlanFeatures()
  const actionsDisabled = useActionsDisabled()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [copyExpensesOpen, setCopyExpensesOpen] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editNightlyRate, setEditNightlyRate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [icalUrl, setIcalUrl] = useState('')
  const [calendarPlatform, setCalendarPlatform] = useState<CalendarSyncPlatform>('AIRBNB')
  const [headline, setHeadline] = useState('')

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const { data: propertyData, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api<{ property: Property }>(`/properties/${id}`),
    enabled: Boolean(id),
  })

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', 'property', id],
    queryFn: () => api<PropertyDashboard>(`/dashboard/properties/${id}`),
    enabled: Boolean(id),
  })

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', id, monthStart, monthEnd],
    queryFn: () =>
      apiRequestPaginated<Expense>(
        `/expenses?propertyId=${id}&from=${monthStart}&to=${monthEnd}&limit=100`,
        { token },
      ),
    enabled: Boolean(id && token),
  })

  const { data: sync } = useQuery({
    queryKey: ['calendar-sync', id],
    queryFn: () =>
      api<{
        sync: {
          platform: CalendarSyncPlatform
          icalUrl: string
          lastSyncedAt: string | null
        } | null
      }>(`/properties/${id}/calendar-sync`),
    enabled: Boolean(id && token),
  })

  const property = propertyData?.property
  const performance = dashboardData?.performance
  const expenses = expensesData?.data ?? []

  const healthScore = useMemo(
    () =>
      listingHealthScore({
        imageCount: property?.imageUrls.length ?? 0,
        hasDescription: Boolean(property?.description),
        hasNightlyRate: Boolean(property?.nightlyRate),
        revenue: performance?.revenue ?? 0,
        occupancyRate: performance?.occupancyRate ?? 0,
      }),
    [property, performance],
  )

  const expenseLogTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  )

  const netProfitMetrics = useMemo(() => {
    const revenue = performance?.revenue ?? 0
    const monthlyExpenses = expenseLogTotal || performance?.monthlyExpenses || 0
    const netProfit = revenue - monthlyExpenses

    const previousMonth = dashboardData?.trends.at(-2)
    if (!previousMonth) {
      return {
        netProfit,
        showTrend: false,
        trendPositive: false,
        trendFlat: false,
        changePercent: null as number | null,
      }
    }

    const previousNetProfit = previousMonth.revenue - previousMonth.expenses
    const delta = netProfit - previousNetProfit
    const trendPositive = delta > 0
    const trendFlat = delta === 0

    let changePercent: number | null
    if (previousNetProfit === 0) {
      changePercent = netProfit === 0 ? 0 : null
    } else {
      changePercent = Math.round((delta / Math.abs(previousNetProfit)) * 100)
    }

    return {
      netProfit,
      showTrend: true,
      trendPositive,
      trendFlat,
      changePercent,
    }
  }, [performance, expenseLogTotal, dashboardData?.trends])

  const invalidateExpenses = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses', id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'property', id] })
  }

  const updateExpenseMutation = useMutation({
    mutationFn: ({
      expenseId,
      category,
      amount,
    }: {
      expenseId: string
      category: string
      amount: number
    }) =>
      api(`/expenses/${expenseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ category, amount }),
      }),
    onSuccess: invalidateExpenses,
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) =>
      api(`/expenses/${expenseId}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidateExpenses,
  })

  const updatePropertyMutation = useMutation({
    mutationFn: () =>
      api(`/properties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          location: editLocation,
          nightlyRate: editNightlyRate ? Number(editNightlyRate) : undefined,
          description: editDescription || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'property', id] })
      setEditOpen(false)
    },
  })

  const connectSyncMutation = useMutation({
    mutationFn: () =>
      api(`/properties/${id}/calendar-sync`, {
        method: 'POST',
        body: JSON.stringify({ platform: calendarPlatform, icalUrl }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-sync', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })

  const publishListingMutation = useMutation({
    mutationFn: async () => {
      await api(`/properties/${id}/listing/publish`, {
        method: 'POST',
        body: JSON.stringify({ published: true }),
      })
      await api(`/properties/${id}/listing`, {
        method: 'POST',
        body: JSON.stringify({ headline }),
      })
    },
  })

  function openEditDialog() {
    if (!property) return
    setEditName(property.name)
    setEditLocation(property.location)
    setEditNightlyRate(property.nightlyRate ? String(property.nightlyRate) : '')
    setEditDescription(property.description ?? '')
    setIcalUrl(sync?.sync?.icalUrl ?? '')
    setCalendarPlatform(sync?.sync?.platform ?? 'AIRBNB')
    setEditOpen(true)
  }

  if (propertyLoading || dashboardLoading || !property || !performance) {
    return <PropertyDetailPageSkeleton />
  }

  const revenueTrendPositive = dashboardData.revenueChangePercent >= 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h2" className="text-3xl font-bold tracking-tight">
            {property.name}
          </Typography>
          <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <Typography variant="caption" className="text-sm">
              {property.location}
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PropertyStatusBadge
            occupancy={performance.occupancyRate}
            revenue={performance.revenue}
          />
          <Button variant="outlined" className="bg-card" onClick={openEditDialog}>
            <Pencil className="size-4" />
            Edit Listing
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-5">
          <Card padding="md" className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Typography variant="h4" className="text-xl font-semibold">
                  Recurring Expenses Setup
                </Typography>
                <Typography variant="caption" className="mt-1 block text-sm text-muted-foreground">
                  Manage standard monthly operational costs
                </Typography>
              </div>
              <button
                type="button"
                disabled={actionsDisabled}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-secondary-50 px-3.5 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary-100 disabled:pointer-events-none disabled:opacity-50"
                onClick={() => setCopyExpensesOpen(true)}
              >
                <Copy className="size-4" />
                Copy from property
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-border bg-muted/20 px-4 py-3">
                <Typography
                  variant="caption"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Category
                </Typography>
                <Typography
                  variant="caption"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Amount (₦)
                </Typography>
                <span className="sr-only">Actions</span>
              </div>

              {expensesLoading ? (
                <div className="px-4 py-6">
                  <Typography variant="caption" className="text-muted-foreground">
                    Loading expenses...
                  </Typography>
                </div>
              ) : expenses.length === 0 ? (
                <div className="px-4 py-6">
                  <Typography variant="caption" className="text-muted-foreground">
                    No expenses logged for this month yet.
                  </Typography>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <Select
                      value={expense.category}
                      className={expenseFieldClassName}
                      options={EXPENSE_CATEGORIES.map((category) => ({
                        label: category,
                        value: category,
                      }))}
                      onChange={(event) =>
                        updateExpenseMutation.mutate({
                          expenseId: expense.id,
                          category: event.target.value,
                          amount: expense.amount,
                        })
                      }
                    />
                    <Input
                      type="number"
                      className={expenseFieldClassName}
                      defaultValue={String(expense.amount)}
                      onBlur={(event) => {
                        const amount = Number(event.target.value)
                        if (amount !== expense.amount) {
                          updateExpenseMutation.mutate({
                            expenseId: expense.id,
                            category: expense.category,
                            amount,
                          })
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={actionsDisabled}
                      className="inline-flex size-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive-50 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Delete expense"
                      onClick={() => deleteExpenseMutation.mutate(expense.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={actionsDisabled}
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-secondary hover:underline disabled:pointer-events-none disabled:opacity-50"
              onClick={() => setAddExpenseOpen(true)}
            >
              <Plus className="size-4" />
              Add New Expense
            </button>
          </Card>

          <Card padding="md" className="flex flex-col gap-5">
            <Typography variant="h4" className="text-xl font-semibold">
              Monthly Expense Log
            </Typography>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Typography
                  variant="caption"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Category
                </Typography>
                <Typography
                  variant="caption"
                  className="hidden text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:block"
                >
                  Date
                </Typography>
                <Typography
                  variant="caption"
                  className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Amount (₦)
                </Typography>
              </div>

              {expensesLoading ? (
                <div className="px-4 py-6">
                  <Typography variant="caption" className="text-muted-foreground">
                    Loading expenses...
                  </Typography>
                </div>
              ) : expenses.length === 0 ? (
                <div className="px-4 py-6">
                  <Typography variant="caption" className="text-muted-foreground">
                    No expenses recorded this month.
                  </Typography>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <Typography variant="label" className="text-sm">
                      {expense.category}
                    </Typography>
                    <Typography variant="caption" className="hidden text-muted-foreground sm:block">
                      {format(parseISO(expense.expenseDate), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="label" className="text-right text-sm font-semibold">
                      {formatNaira(expense.amount)}
                    </Typography>
                  </div>
                ))
              )}

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border bg-muted/10 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Typography variant="label">Total Expenses</Typography>
                <span className="hidden sm:block" aria-hidden />
                <Typography variant="h4" className="text-right text-lg font-bold text-destructive">
                  {formatNaira(expenseLogTotal || performance.monthlyExpenses)}
                </Typography>
              </div>
            </div>

            <Button
              variant="outlined"
              className="w-full bg-card sm:w-auto"
              onClick={() => setReportOpen(true)}
              disabled={!hasMonthlyReports}
            >
              {hasMonthlyReports ? 'View Full Report' : 'Reports (Growth+)'}
            </Button>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <PropertyMetricCard label="Monthly Revenue">
            <Typography variant="h2" className="text-3xl font-bold tracking-tight">
              {formatNaira(performance.revenue)}
            </Typography>
            <Typography
              variant="caption"
              className={cn(
                'text-sm font-medium',
                revenueTrendPositive ? 'text-tertiary-600' : 'text-destructive',
              )}
            >
              {revenueTrendPositive ? '↗' : '↘'} {Math.abs(dashboardData.revenueChangePercent)}%
              {' vs last month'}
            </Typography>
          </PropertyMetricCard>

          <PropertyMetricCard label="Net Profit">
            {hasProfitSummary ? (
              <>
                <Typography
                  variant="h2"
                  className={cn(
                    'text-3xl font-bold tracking-tight',
                    netProfitMetrics.netProfit < 0 && 'text-destructive',
                  )}
                >
                  {formatNaira(netProfitMetrics.netProfit)}
                </Typography>
                {netProfitMetrics.showTrend ? (
                  <Typography
                    variant="caption"
                    className={cn(
                      'text-sm font-medium',
                      netProfitMetrics.trendFlat
                        ? 'text-muted-foreground'
                        : netProfitMetrics.trendPositive
                          ? 'text-tertiary-600'
                          : 'text-destructive',
                    )}
                  >
                    {netProfitMetrics.trendFlat
                      ? '→'
                      : netProfitMetrics.trendPositive
                        ? '↗'
                        : '↘'}{' '}
                    {netProfitMetrics.changePercent !== null
                      ? `${Math.abs(netProfitMetrics.changePercent)}% vs last month`
                      : netProfitMetrics.netProfit > 0
                        ? 'Above break-even last month'
                        : 'Below break-even last month'}
                  </Typography>
                ) : null}
              </>
            ) : (
              <Typography variant="caption" className="text-muted-foreground">
                <a href="/settings#pricing" data-allow-readonly-nav className="text-secondary hover:underline">
                  Upgrade to Starter
                </a>{' '}
                for profit summary
              </Typography>
            )}
          </PropertyMetricCard>

          <PropertyMetricCard label="Occupancy Rate">
            <Typography variant="h2" className="text-3xl font-bold tracking-tight">
              {performance.occupancyRate}%
            </Typography>
            <ProgressBar
              value={performance.occupancyRate}
              barClassName="bg-secondary"
              className="mt-1"
            />
          </PropertyMetricCard>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-primary-900 p-6 text-primary-foreground shadow-md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <Typography variant="h4" className="text-lg font-semibold text-primary-foreground">
              Listing Health
            </Typography>
            <Typography variant="caption" className="mt-1.5 block text-sm text-primary-foreground/70">
              {listingHealthMessage(healthScore)}
            </Typography>
          </div>
          <div className="w-full lg:max-w-md">
            <div className="mb-2 flex items-end justify-between gap-3">
              <Typography variant="h2" className="text-3xl font-bold text-primary-foreground">
                {healthScore}%
              </Typography>
              <Typography variant="caption" className="text-sm text-primary-foreground/70">
                {listingHealthLabel(healthScore)}
              </Typography>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-primary-700">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-300"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {property ? <PropertyReviewsSection propertyId={property.id} /> : null}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Listing">
        <div className="flex flex-col gap-4">
          <Input label="Property name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="Location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
          <Input
            label="Nightly rate (NGN)"
            type="number"
            value={editNightlyRate}
            onChange={(e) => setEditNightlyRate(e.target.value)}
          />
          <Input
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />

          {!hasCalendarSync ? (
            <PlanUpgradeBanner
              requiredPlan="GROWTH"
              feature="Calendar sync and listing publish"
              className="border-0 bg-muted/30 p-4 shadow-none"
            />
          ) : (
            <>
              <Select
                label="Calendar platform"
                value={calendarPlatform}
                onChange={(event) =>
                  setCalendarPlatform(event.target.value as CalendarSyncPlatform)
                }
                options={[
                  { label: CALENDAR_SYNC_PLATFORM_LABELS.AIRBNB, value: 'AIRBNB' },
                  { label: CALENDAR_SYNC_PLATFORM_LABELS.BOOKING, value: 'BOOKING' },
                ]}
              />
              <CalendarPlatformHelp platform={calendarPlatform} />
              <Input
                label={`${CALENDAR_SYNC_PLATFORM_LABELS[calendarPlatform]} iCal URL`}
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://..."
              />
              {sync?.sync?.lastSyncedAt ? (
                <Typography variant="caption" className="text-muted-foreground">
                  Last synced {format(parseISO(sync.sync.lastSyncedAt), 'MMM d, yyyy h:mm a')}
                </Typography>
              ) : null}

              <Input
                label="Listing headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              loading={updatePropertyMutation.isPending}
              onClick={() => updatePropertyMutation.mutate()}
            >
              Save changes
            </Button>
            {hasCalendarSync ? (
              <>
                <Button
                  variant="outlined"
                  loading={connectSyncMutation.isPending}
                  disabled={!icalUrl.trim()}
                  onClick={() => connectSyncMutation.mutate()}
                >
                  {sync?.sync ? 'Sync calendar' : 'Connect & sync calendar'}
                </Button>
                <Button
                  variant="outlined"
                  loading={publishListingMutation.isPending}
                  onClick={() => publishListingMutation.mutate()}
                >
                  Publish listing
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </Dialog>

      <AddExpenseDialog
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        propertyId={property.id}
        propertyName={property.name}
        onAdded={invalidateExpenses}
      />

      <CopyExpensesDialog
        open={copyExpensesOpen}
        onClose={() => setCopyExpensesOpen(false)}
        targetPropertyId={property.id}
        targetPropertyName={property.name}
        onCopied={invalidateExpenses}
      />

      <PropertyReportViewer
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        propertyId={property.id}
        propertyName={property.name}
        token={token}
      />
    </div>
  )
}
