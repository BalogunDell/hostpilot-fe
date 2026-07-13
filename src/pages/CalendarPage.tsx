import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfYear, endOfYear } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Link2, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button, ConnectCalendarDialog, PlanUpgradeBanner, Select, Typography } from '../components'
import { apiRequestPaginated } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { bookingToCalendarEvent } from '../lib/bookingDates'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => ({
  label: format(new Date(2000, month, 1), 'MMMM'),
  value: String(month),
}))

function buildYearOptions(centerYear: number) {
  return Array.from({ length: 11 }, (_, index) => {
    const year = centerYear - 5 + index
    return { label: String(year), value: String(year) }
  })
}

interface Booking {
  id: string
  guestName: string
  propertyId: string
  checkIn: string
  checkOut: string
  source?: string
}

interface CalendarSync {
  propertyId: string
  platform: string
  icalUrl: string
  lastSyncedAt: string | null
}

interface SyncAllResult {
  syncedCount: number
  failedCount: number
  results: Array<{
    propertyId: string
    source: string
    success: boolean
    error?: string
  }>
}

export function CalendarPage() {
  const api = useApi()
  const { token } = useAuth()
  const { showToast } = useToast()
  const { hasCalendarSync } = usePlanFeatures()
  const queryClient = useQueryClient()
  const [connectOpen, setConnectOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const yearOptions = useMemo(
    () => buildYearOptions(currentDate.getFullYear()),
    [currentDate],
  )

  function goToMonth(month: number) {
    setCurrentDate((previous) => new Date(previous.getFullYear(), month, 1))
  }

  function goToYear(year: number) {
    setCurrentDate((previous) => new Date(year, previous.getMonth(), 1))
  }

  function shiftMonth(delta: number) {
    setCurrentDate((previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1))
  }

  const { data: syncsData } = useQuery({
    queryKey: ['calendar-syncs'],
    queryFn: () => api<{ syncs: CalendarSync[] }>('/calendar-sync'),
    enabled: Boolean(token),
  })

  const calendarRange = useMemo(() => {
    const year = currentDate.getFullYear()
    const rangeStart = format(startOfYear(new Date(year - 1, 0, 1)), 'yyyy-MM-dd')
    const rangeEnd = format(endOfYear(new Date(year + 1, 0, 1)), 'yyyy-MM-dd')
    return { rangeStart, rangeEnd }
  }, [currentDate])

  const { data } = useQuery({
    queryKey: ['bookings', 'calendar', calendarRange.rangeStart, calendarRange.rangeEnd],
    queryFn: () =>
      apiRequestPaginated<Booking>(
        `/bookings?from=${calendarRange.rangeStart}&to=${calendarRange.rangeEnd}&limit=500`,
        { token },
      ),
    enabled: Boolean(token),
  })

  const connectedSyncs = syncsData?.syncs ?? []
  const hasConnectedCalendars = connectedSyncs.length > 0

  const syncMutation = useMutation({
    mutationFn: () => api<SyncAllResult>('/calendar-sync/sync-all', { method: 'POST' }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', 'calendar'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] })

      if (result.syncedCount === 0 && result.failedCount === 0) {
        setConnectOpen(true)
        return
      }

      if (result.failedCount > 0) {
        showToast(
          `Synced ${result.syncedCount} propert${result.syncedCount === 1 ? 'y' : 'ies'}. ${result.failedCount} failed.`,
          'error',
        )
        return
      }

      showToast(
        `Synced bookings from Airbnb and Bookings.com for ${result.syncedCount} propert${result.syncedCount === 1 ? 'y' : 'ies'}.`,
      )
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Sync failed', 'error')
    },
  })

  function handleConnected() {
    queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] })
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
    queryClient.invalidateQueries({ queryKey: ['bookings', 'calendar'] })
  }

  function handleConnectClick() {
    if (!hasCalendarSync) return
    setConnectOpen(true)
  }

  function handleSyncClick() {
    if (!hasCalendarSync) return
    syncMutation.mutate()
  }

  const events = (data?.data ?? [])
    .map((booking) => {
      const range = bookingToCalendarEvent(booking.checkIn, booking.checkOut)
      if (!range) return null

      return {
        id: booking.id,
        title: booking.source ? `${booking.guestName} (${booking.source})` : booking.guestName,
        ...range,
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)

  return (
    <div className="flex flex-col gap-4">
      {!hasCalendarSync ? (
        <PlanUpgradeBanner
          requiredPlan="GROWTH"
          feature="Calendar sync with Airbnb and Booking.com"
        />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography variant="h2">Calendar</Typography>
          <Typography variant="caption" className="mt-1 block text-muted-foreground">
            Import bookings from connected Airbnb and Bookings.com calendars.
          </Typography>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          {!hasConnectedCalendars ? (
            <Button className="w-full sm:w-auto" onClick={handleConnectClick} disabled={!hasCalendarSync}>
              <Link2 className="size-4" aria-hidden />
              Connect calendar
            </Button>
          ) : (
            <Button
              className="w-full sm:w-auto"
              onClick={handleSyncClick}
              loading={syncMutation.isPending}
              disabled={!hasCalendarSync}
            >
              <RefreshCw className="size-4" aria-hidden />
              Sync Airbnb & Bookings.com
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-[420px] h-[min(600px,70svh)] overflow-x-auto rounded-xl border border-border bg-card p-2 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outlined"
            size="icon-sm"
            className="bg-card"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="w-[9.5rem]">
            <Select
              aria-label="Month"
              value={String(currentDate.getMonth())}
              options={MONTH_OPTIONS}
              onChange={(event) => goToMonth(Number(event.target.value))}
            />
          </div>
          <div className="w-[6.5rem]">
            <Select
              aria-label="Year"
              value={String(currentDate.getFullYear())}
              options={yearOptions}
              onChange={(event) => goToYear(Number(event.target.value))}
            />
          </div>
          <Button
            type="button"
            variant="outlined"
            size="icon-sm"
            className="bg-card"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outlined"
            size="sm"
            className="bg-card"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
        <div className="h-full min-w-[320px]">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            toolbar={false}
            views={['month']}
            defaultView="month"
            date={currentDate}
            onNavigate={setCurrentDate}
          />
        </div>
      </div>

      <ConnectCalendarDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={handleConnected}
      />
    </div>
  )
}
