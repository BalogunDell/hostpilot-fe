import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { Copy, Download, MoreVertical, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Dropdown,
  Input,
  MoneyInput,
  Select,
  StatCard,
  TableSkeleton,
  StatCardsSkeleton,
  Typography,
  WhatsAppBookingBanner,
} from '../components'
import { apiRequestPaginated, formatNaira } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { cn } from '../lib/cn'
import { formatMoneyInputNumber, parseMoneyInput } from '../lib/moneyInput'
import {
  formatBlockedRange,
  formatBookingDisplayDate,
  isCheckInDateBlocked,
  isPastCheckout,
  minCheckOutDate,
  validateBookingDates,
} from '../lib/bookingDates'
import { CreateReviewLinkDialog } from '../components/CreateReviewLinkDialog'

interface Booking {
  id: string
  propertyId: string
  guestName: string
  checkIn: string
  checkOut: string
  amount: number
  source: string
}

interface Property {
  id: string
  name: string
  location: string
}

type BookingStatus = 'confirmed' | 'pending' | 'completed'

interface ReviewRequest {
  id: string
  bookingId: string | null
  token: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  reviewUrl: string
  expiresAt: string
}

function guestInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

function stayNights(checkIn: string, checkOut: string) {
  return Math.max(differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)), 1)
}

function deriveStatus(booking: Booking): BookingStatus {
  const now = new Date()
  if (booking.amount === 0) return 'pending'
  if (parseISO(booking.checkOut) < now) return 'completed'
  return 'confirmed'
}

async function copyReviewLink(url: string, showToast: (message: string, type?: 'success' | 'error') => void) {
  try {
    await navigator.clipboard.writeText(url)
    showToast('Review link copied')
  } catch {
    showToast('Could not copy link', 'error')
  }
}

function reviewLinkPath(reviewRequest: ReviewRequest) {
  if (reviewRequest.reviewUrl) {
    const path = reviewRequest.reviewUrl.replace(/^https?:\/\/[^/]+/, '')
    if (path) return path
  }
  return `/review/${reviewRequest.token}`
}

function ReviewLinkCell({
  booking,
  reviewRequest,
  onCreateLink,
  showToast,
  atReviewLinkLimit,
}: {
  booking: Booking
  reviewRequest?: ReviewRequest
  onCreateLink: () => void
  showToast: (message: string, type?: 'success' | 'error') => void
  atReviewLinkLimit: boolean
}) {
  if (!isPastCheckout(booking.checkOut)) {
    return <Typography variant="caption" className="text-muted-foreground">—</Typography>
  }

  if (reviewRequest?.status === 'used') {
    return <Typography variant="caption" className="text-muted-foreground">Submitted</Typography>
  }

  if (reviewRequest?.status === 'active' && reviewRequest.token) {
    const path = reviewLinkPath(reviewRequest)
    const copyUrl = reviewRequest.reviewUrl || `${window.location.origin}${path}`

    return (
      <div className="flex max-w-[220px] items-center gap-2">
        <Typography variant="caption" className="min-w-0 truncate font-mono text-xs">
          {path}
        </Typography>
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={`Copy review link for ${booking.guestName}`}
          onClick={() => copyReviewLink(copyUrl, showToast)}
        >
          <Copy className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <Typography variant="caption" className="text-muted-foreground">
      {atReviewLinkLimit ? (
        <>
          Limit reached ·{' '}
          <a href="/settings#pricing" data-allow-readonly-nav className="text-secondary hover:underline">
            Upgrade
          </a>
        </>
      ) : (
        <button
          type="button"
          className="text-secondary hover:underline"
          onClick={onCreateLink}
        >
          Create link
        </button>
      )}
    </Typography>
  )
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadBookingsCsv(
  bookings: Booking[],
  propertyMap: Map<string, Property>,
) {
  const headers = ['Guest', 'Property', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Source']
  const rows = bookings.map((booking) => {
    const property = propertyMap.get(booking.propertyId)
    const nights = stayNights(booking.checkIn, booking.checkOut)
    return [
      booking.guestName,
      property?.name ?? '',
      booking.checkIn,
      booking.checkOut,
      String(nights),
      String(booking.amount),
      booking.source,
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function BookingsPage() {
  const api = useApi()
  const { token } = useAuth()
  const { hasExportRecords, hasWhatsApp, hasUnlimitedReviewLinks, reviewLinkLimit } = usePlanFeatures()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [propertyFilter, setPropertyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('Direct')
  const [formError, setFormError] = useState('')
  const [dateError, setDateError] = useState('')
  const [reviewLinkBooking, setReviewLinkBooking] = useState<Booking | null>(null)

  const limit = 10

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api<Property[]>('/properties'),
    enabled: Boolean(token),
  })

  const propertyMap = useMemo(
    () => new Map(properties.map((p) => [p.id, p])),
    [properties],
  )

  const { data: reviewRequestsData } = useQuery({
    queryKey: ['review-requests'],
    queryFn: () => api<{ reviewRequests: ReviewRequest[] }>('/review-requests'),
    enabled: Boolean(token),
  })

  const reviewRequestByBookingId = useMemo(() => {
    const map = new Map<string, ReviewRequest>()
    for (const request of reviewRequestsData?.reviewRequests ?? []) {
      if (request.bookingId) {
        map.set(request.bookingId, request)
      }
    }
    return map
  }, [reviewRequestsData?.reviewRequests])

  const totalReviewLinks = useMemo(
    () =>
      (reviewRequestsData?.reviewRequests ?? []).filter((request) => request.status !== 'cancelled')
        .length,
    [reviewRequestsData?.reviewRequests],
  )

  const atReviewLinkLimit =
    !hasUnlimitedReviewLinks &&
    reviewLinkLimit != null &&
    totalReviewLinks >= reviewLinkLimit

  function getBookingActionItems(booking: Booking) {
    const reviewRequest = reviewRequestByBookingId.get(booking.id)
    const items = [
      {
        label: 'Edit booking',
        value: 'edit-booking',
        onSelect: () => openEditDialog(booking),
      },
    ]

    if (isPastCheckout(booking.checkOut)) {
      if (reviewRequest?.status === 'active') {
        items.push({
          label: 'Copy review link',
          value: 'copy-review-link',
          onSelect: () => setReviewLinkBooking(booking),
        })
      } else if (reviewRequest?.status === 'used') {
        items.push({
          label: 'Review submitted',
          value: 'review-used',
          onSelect: () => {},
        })
      } else {
        items.push({
          label: 'Create review link',
          value: 'create-review-link',
          onSelect: () => setReviewLinkBooking(booking),
        })
      }
    }

    return items
  }

  useEffect(() => {
    if (properties.length === 0) return

    const hasValidFilter = properties.some((property) => property.id === propertyFilter)
    if (!hasValidFilter) {
      setPropertyFilter(properties[0].id)
      setPage(1)
    }
  }, [properties, propertyFilter])

  const queryString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(propertyFilter ? { propertyId: propertyFilter } : {}),
  }).toString()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bookings', page, propertyFilter],
    queryFn: () => apiRequestPaginated<Booking>(`/bookings?${queryString}`, { token }),
    enabled: Boolean(token && (properties.length === 0 || propertyFilter)),
  })

  const { data: propertyBookingsData } = useQuery({
    queryKey: ['bookings', 'property', propertyId],
    queryFn: () =>
      apiRequestPaginated<Booking>(
        `/bookings?propertyId=${propertyId}&limit=100`,
        { token },
      ),
    enabled: Boolean(token && propertyId && dialogOpen),
  })

  const propertyBookings = useMemo(
    () => propertyBookingsData?.data ?? [],
    [propertyBookingsData?.data],
  )

  const bookingsForValidation = useMemo(
    () =>
      editingBookingId
        ? propertyBookings.filter((booking) => booking.id !== editingBookingId)
        : propertyBookings,
    [propertyBookings, editingBookingId],
  )

  const blockedRangesLabel = useMemo(
    () => bookingsForValidation.map(formatBlockedRange).join(', '),
    [bookingsForValidation],
  )

  useEffect(() => {
    if (!checkIn && !checkOut) {
      setDateError('')
      return
    }
    setDateError(validateBookingDates(checkIn, checkOut, bookingsForValidation) ?? '')
  }, [checkIn, checkOut, bookingsForValidation])

  function resetForm() {
    setEditingBookingId(null)
    setGuestName('')
    setPropertyId('')
    setCheckIn('')
    setCheckOut('')
    setAmount('')
    setSource('Direct')
    setFormError('')
    setDateError('')
  }

  function openAddDialog() {
    resetForm()
    if (properties.length > 0) {
      setPropertyId(properties[0].id)
    }
    setDialogOpen(true)
  }

  function openEditDialog(booking: Booking) {
    setEditingBookingId(booking.id)
    setGuestName(booking.guestName)
    setPropertyId(booking.propertyId)
    setCheckIn(booking.checkIn)
    setCheckOut(booking.checkOut)
    setAmount(formatMoneyInputNumber(booking.amount))
    setSource(booking.source)
    setFormError('')
    setDateError('')
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    resetForm()
  }

  const bookings = useMemo(() => {
    const rows = data?.data ?? []
    if (!statusFilter) return rows
    return rows.filter((booking) => deriveStatus(booking) === statusFilter)
  }, [data?.data, statusFilter])

  const stats = useMemo(() => {
    const rows = data?.data ?? []
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const active = rows.filter((b) =>
      isWithinInterval(now, { start: parseISO(b.checkIn), end: parseISO(b.checkOut) }),
    ).length

    const monthlyRevenue = rows
      .filter((b) => isWithinInterval(parseISO(b.checkIn), { start: monthStart, end: monthEnd }))
      .reduce((sum, b) => sum + b.amount, 0)

    const avgStay =
      rows.length > 0
        ? rows.reduce((sum, b) => sum + stayNights(b.checkIn, b.checkOut), 0) / rows.length
        : 0

    return { active, monthlyRevenue, avgStay, total: data?.meta.total ?? 0 }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        guestName,
        checkIn,
        checkOut,
        amount: parseMoneyInput(amount),
        source,
      }

      if (editingBookingId) {
        return api(`/bookings/${editingBookingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      }

      return api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ propertyId, ...payload }),
      })
    },
  })

  async function handleSaveBooking() {
    const wasEdit = Boolean(editingBookingId)

    try {
      await saveMutation.mutateAsync()
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      await queryClient.invalidateQueries({ queryKey: ['review-requests'] })
      closeDialog()
      if (wasEdit) {
        showToast('Booking updated successfully')
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : wasEdit
            ? 'Failed to update booking'
            : 'Failed to create booking',
      )
    }
  }

  const meta = data?.meta

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Typography variant="h2">Bookings Management</Typography>
          <Typography variant="caption" className="mt-1 block">
            Monitor and manage all reservations across your property portfolio.
          </Typography>
        </div>
        <Button className="w-full shrink-0 sm:w-auto" onClick={openAddDialog}>
          <Plus className="size-4" />
          Add Booking
        </Button>
      </div>

      <WhatsAppBookingBanner />

      {isLoading && !data ? (
        <StatCardsSkeleton count={3} className="sm:grid-cols-2 xl:grid-cols-3" />
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Active bookings"
          value={String(stats.active)}
          subtext={`${stats.total} total on record`}
        />
        <StatCard label="Monthly revenue" value={formatNaira(stats.monthlyRevenue)} />
        <StatCard
          label="Avg. stay length"
          value={`${stats.avgStay.toFixed(1)} nights`}
          subtext="Across current page"
        />
      </div>
      )}

      <Card padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
            <Select
              label="Property"
              value={propertyFilter}
              onChange={(e) => {
                setPropertyFilter(e.target.value)
                setPage(1)
              }}
              options={properties.map((p) => ({ label: p.name, value: p.id }))}
              placeholder={properties.length === 0 ? 'No properties' : 'Select property'}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Pending', value: 'pending' },
                { label: 'Completed', value: 'completed' },
              ]}
            />
          </div>
          <Button
            variant="outlined"
            className="w-full lg:w-auto"
            disabled={!hasExportRecords || bookings.length === 0}
            onClick={() => {
              if (!hasExportRecords) return
              downloadBookingsCsv(bookings, propertyMap)
              showToast('Bookings exported')
            }}
          >
            <Download className="size-4" />
            {hasExportRecords ? 'Export' : 'Export (Growth+)'}
          </Button>
        </div>
      </Card>

      {isLoading ? <TableSkeleton rows={6} /> : null}

      {isError ? (
        <Typography className="text-destructive">
          {error instanceof Error ? error.message : 'Failed to load bookings'}
        </Typography>
      ) : null}

      {!isLoading && !isError ? (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Check-out</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Income</th>
                  <th className="px-4 py-3 font-medium">Review link</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No bookings yet. Add your first booking to get started.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const property = propertyMap.get(booking.propertyId)
                    const status = deriveStatus(booking)
                    const reviewRequest = reviewRequestByBookingId.get(booking.id)
                    return (
                      <tr key={booking.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              alt={booking.guestName}
                              fallback={guestInitials(booking.guestName)}
                              size="sm"
                            />
                            <div>
                              <Typography variant="label">{booking.guestName}</Typography>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Typography variant="label">{property?.name ?? 'Property'}</Typography>
                        </td>
                        <td className="px-4 py-4">
                          <Typography
                            variant="label"
                            className={cn(status === 'completed' && 'line-through opacity-60')}
                          >
                            {formatBookingDisplayDate(booking.checkIn)}
                          </Typography>
                        </td>
                        <td className="px-4 py-4">
                          <Typography
                            variant="label"
                            className={cn(status === 'completed' && 'line-through opacity-60')}
                          >
                            {formatBookingDisplayDate(booking.checkOut)}
                          </Typography>
                        </td>
                        <td className="px-4 py-4">
                          <Typography variant="label">{booking.source}</Typography>
                        </td>
                        <td className="px-4 py-4">
                          <Typography variant="label">{formatNaira(booking.amount)}</Typography>
                        </td>
                        <td className="px-4 py-4">
                          <ReviewLinkCell
                            booking={booking}
                            reviewRequest={reviewRequest}
                            onCreateLink={() => setReviewLinkBooking(booking)}
                            showToast={showToast}
                            atReviewLinkLimit={atReviewLinkLimit}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Dropdown
                            align="end"
                            trigger={
                              <span
                                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                aria-label={`Actions for ${booking.guestName}`}
                              >
                                <MoreVertical className="size-4" />
                              </span>
                            }
                            items={getBookingActionItems(booking)}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {bookings.length === 0 ? (
              <Card padding="md">
                <Typography variant="caption">No bookings yet.</Typography>
              </Card>
            ) : (
              bookings.map((booking) => {
                const property = propertyMap.get(booking.propertyId)
                const nights = stayNights(booking.checkIn, booking.checkOut)
                const reviewRequest = reviewRequestByBookingId.get(booking.id)
                return (
                  <Card key={booking.id} padding="md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          alt={booking.guestName}
                          fallback={guestInitials(booking.guestName)}
                          size="sm"
                        />
                        <div>
                          <Typography variant="label">{booking.guestName}</Typography>
                          <Typography variant="caption">{property?.name}</Typography>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dropdown
                          align="end"
                          trigger={
                            <span
                              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              aria-label={`Actions for ${booking.guestName}`}
                            >
                              <MoreVertical className="size-4" />
                            </span>
                          }
                          items={getBookingActionItems(booking)}
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Typography variant="caption">Check-in</Typography>
                        <Typography variant="label">
                          {formatBookingDisplayDate(booking.checkIn)}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption">Check-out</Typography>
                        <Typography variant="label">
                          {formatBookingDisplayDate(booking.checkOut)}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption">Number of Nights</Typography>
                        <Typography variant="label">
                          {nights} {nights === 1 ? 'night' : 'nights'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption">Income</Typography>
                        <Typography variant="label">{formatNaira(booking.amount)}</Typography>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Typography variant="caption">Review link</Typography>
                      <div className="mt-1">
                        <ReviewLinkCell
                          booking={booking}
                          reviewRequest={reviewRequest}
                          onCreateLink={() => setReviewLinkBooking(booking)}
                          showToast={showToast}
                          atReviewLinkLimit={atReviewLinkLimit}
                        />
                      </div>
                    </div>
                    <Typography variant="caption" className="mt-2 block">
                      via {booking.source}
                    </Typography>
                  </Card>
                )
              })
            )}
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Typography variant="caption">
                Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} bookings
              </Typography>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Typography variant="caption">
                  Page {meta.page} of {meta.totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editingBookingId ? 'Edit Booking' : 'Add Booking'}
      >
        <div className="flex flex-col gap-4">
          <Input label="Guest name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          <Select
            label="Property"
            value={propertyId}
            disabled={Boolean(editingBookingId)}
            onChange={(e) => {
              setPropertyId(e.target.value)
              setCheckIn('')
              setCheckOut('')
              setDateError('')
            }}
            options={properties.map((p) => ({ label: p.name, value: p.id }))}
            placeholder="Select property"
          />
          {propertyId && bookingsForValidation.length > 0 ? (
            <Typography variant="caption" className="text-muted-foreground">
              Booked dates: {blockedRangesLabel}
            </Typography>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Check-in"
              type="date"
              value={checkIn}
              disabled={!propertyId}
              onChange={(e) => {
                const value = e.target.value
                if (!value) {
                  setCheckIn('')
                  return
                }
                if (isCheckInDateBlocked(value, bookingsForValidation)) {
                  setDateError('Check-in date falls within an existing booking.')
                  return
                }
                setCheckIn(value)
                if (checkOut && parseISO(checkOut) <= parseISO(value)) {
                  setCheckOut('')
                }
              }}
              error={dateError && checkIn ? dateError : undefined}
            />
            <Input
              label="Check-out"
              type="date"
              value={checkOut}
              disabled={!propertyId || !checkIn}
              min={minCheckOutDate(checkIn)}
              onChange={(e) => setCheckOut(e.target.value)}
              error={dateError && checkOut ? dateError : undefined}
            />
          </div>
          <MoneyInput
            label="Amount (NGN)"
            value={amount}
            onValueChange={setAmount}
            placeholder="0"
          />
          <Select
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={[
              { label: 'Direct', value: 'Direct' },
              { label: 'Airbnb', value: 'Airbnb' },
              { label: 'Booking.com', value: 'Booking.com' },
              {
                label: hasWhatsApp ? 'WhatsApp' : 'WhatsApp (Growth+)',
                value: 'WhatsApp',
                disabled: !hasWhatsApp,
              },
            ]}
          />
          {!hasWhatsApp ? (
            <Typography variant="caption" className="text-muted-foreground">
              WhatsApp source requires a{' '}
              <a href="/settings#pricing" data-allow-readonly-nav className="text-secondary hover:underline">
                Growth
              </a>{' '}
              plan or above.
            </Typography>
          ) : null}
          {formError ? (
            <Typography variant="caption" className="text-destructive">{formError}</Typography>
          ) : null}
          <Button
            loading={saveMutation.isPending}
            onClick={handleSaveBooking}
            disabled={
              !guestName || !propertyId || !checkIn || !checkOut || !parseMoneyInput(amount) || Boolean(dateError)
            }
          >
            {editingBookingId ? 'Update booking' : 'Save booking'}
          </Button>
        </div>
      </Dialog>

      {reviewLinkBooking ? (
        <CreateReviewLinkDialog
          open={Boolean(reviewLinkBooking)}
          onClose={() => setReviewLinkBooking(null)}
          bookingId={reviewLinkBooking.id}
          guestName={reviewLinkBooking.guestName}
          existingRequest={reviewRequestByBookingId.get(reviewLinkBooking.id) ?? null}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['review-requests'] })
          }}
        />
      ) : null}
    </div>
  )
}
