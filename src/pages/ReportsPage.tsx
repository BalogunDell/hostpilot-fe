import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Download, FileBarChart2 } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  Typography,
} from '../components'
import { PropertyReportViewer } from '../components/PropertyReportViewer'
import { apiRequestPaginated, downloadPropertyReportPdf, formatNaira } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useDashboardPeriod } from '../context/DashboardPeriodContext'
import { useSelectedProperty } from '../context/SelectedPropertyContext'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { AppLink } from '../context/AppNavigation'

interface Booking {
  id: string
  amount: number
  checkIn: string
  checkOut: string
  guestName: string
}

interface Expense {
  id: string
  amount: number
  expenseDate: string
  category: string
}

export function ReportsPage() {
  const { token } = useAuth()
  const { from: monthFrom, to: monthTo } = useDashboardPeriod()
  const { selectedProperty, selectedPropertyId } = useSelectedProperty()
  const { hasMonthlyReports } = usePlanFeatures()

  const [from, setFrom] = useState(monthFrom)
  const [to, setTo] = useState(monthTo)
  const [appliedFrom, setAppliedFrom] = useState(monthFrom)
  const [appliedTo, setAppliedTo] = useState(monthTo)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [rangeError, setRangeError] = useState('')

  useEffect(() => {
    setFrom(monthFrom)
    setTo(monthTo)
    setAppliedFrom(monthFrom)
    setAppliedTo(monthTo)
  }, [monthFrom, monthTo, selectedPropertyId])

  const bookingsQuery = useQuery({
    queryKey: ['reports', 'bookings', selectedPropertyId, appliedFrom, appliedTo],
    queryFn: () =>
      apiRequestPaginated<Booking>(
        `/bookings?propertyId=${selectedPropertyId}&from=${appliedFrom}&to=${appliedTo}&limit=100`,
        { token },
      ),
    enabled: Boolean(token && selectedPropertyId && appliedFrom && appliedTo),
  })

  const expensesQuery = useQuery({
    queryKey: ['reports', 'expenses', selectedPropertyId, appliedFrom, appliedTo],
    queryFn: () =>
      apiRequestPaginated<Expense>(
        `/expenses?propertyId=${selectedPropertyId}&from=${appliedFrom}&to=${appliedTo}&limit=100`,
        { token },
      ),
    enabled: Boolean(token && selectedPropertyId && appliedFrom && appliedTo),
  })

  const summary = useMemo(() => {
    const bookings = bookingsQuery.data?.data ?? []
    const expenses = expensesQuery.data?.data ?? []
    const revenue = bookings.reduce((sum, booking) => sum + booking.amount, 0)
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      revenue,
      expenses: expenseTotal,
      net: revenue - expenseTotal,
      bookingCount: bookings.length,
      expenseCount: expenses.length,
    }
  }, [bookingsQuery.data, expensesQuery.data])

  function applyRange() {
    if (!from || !to) {
      setRangeError('Choose both dates.')
      return
    }
    if (from > to) {
      setRangeError('Start date must be on or before the end date.')
      return
    }
    setRangeError('')
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  if (!selectedPropertyId || !selectedProperty) {
    return (
      <Typography variant="body" className="text-muted-foreground">
        Select a property from the top bar to view reports.
      </Typography>
    )
  }

  const loading = bookingsQuery.isLoading || expensesQuery.isLoading

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="caption">
        Performance for {selectedProperty.name}
      </Typography>

      <Card padding="md" className="flex flex-col gap-4">
        <Typography variant="label">Date range</Typography>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
          <Button className="sm:mt-7" onClick={applyRange}>
            Apply
          </Button>
        </div>
        {rangeError ? (
          <Typography variant="caption" className="text-destructive">
            {rangeError}
          </Typography>
        ) : (
          <Typography variant="caption">
            Showing {appliedFrom} → {appliedTo}
          </Typography>
        )}
      </Card>

      {loading ? (
        <>
          <PageHeaderSkeleton />
          <StatCardsSkeleton />
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Revenue', value: formatNaira(summary.revenue) },
            { label: 'Expenses', value: formatNaira(summary.expenses) },
            { label: 'Net', value: formatNaira(summary.net) },
            { label: 'Bookings', value: String(summary.bookingCount) },
          ].map((item) => (
            <Card key={item.label} padding="md" className="flex flex-col gap-1">
              <Typography variant="caption">{item.label}</Typography>
              <Typography variant="h3">{item.value}</Typography>
            </Card>
          ))}
        </div>
      )}

      <Card padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography variant="label">Monthly PDF report</Typography>
          <Typography variant="caption" className="mt-1 block">
            Full performance PDF for the month selected in Viewing.
          </Typography>
        </div>
        {hasMonthlyReports ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outlined" onClick={() => setViewerOpen(true)}>
              <FileBarChart2 className="size-4" aria-hidden />
              View report
            </Button>
            <Button
              variant="outlined"
              loading={downloading}
              onClick={async () => {
                setDownloading(true)
                try {
                  await downloadPropertyReportPdf(selectedProperty.id, token)
                } finally {
                  setDownloading(false)
                }
              }}
            >
              <Download className="size-4" aria-hidden />
              Download
            </Button>
          </div>
        ) : (
          <Typography variant="caption">
            PDF reports need{' '}
            <AppLink to="/settings#pricing" allowWhenReadOnly className="text-secondary hover:underline">
              Growth or Pro
            </AppLink>
            .
          </Typography>
        )}
      </Card>

      <PropertyReportViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        propertyId={selectedProperty.id}
        propertyName={selectedProperty.name}
        token={token}
      />
    </div>
  )
}
