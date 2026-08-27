import {
  BOOKING_PLATFORM_FEE_PER_NIGHT_NGN,
  BOOKING_VAT_PERCENT,
  computeBookingCheckoutTotals,
  computeStayTotalFromNightlyRate,
} from '@staypilot/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, Input, MoneyInput, Select, Typography } from './index'
import {
  PayoutDetailsFields,
  emptyPayoutForm,
  payoutPayloadOrUndefined,
  usePayoutStatus,
  validatePayoutForm,
  type PayoutFormValues,
} from './PayoutDetailsFields'
import { ApiError, apiRequestPaginated, formatNaira } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import {
  computeAvailableStayRanges,
  defaultAvailabilityWindow,
  formatBlockedRange,
  minCheckOutDate,
  upcomingBookedRanges,
  validateBookingDates,
} from '../lib/bookingDates'
import { parseMoneyInput } from '../lib/moneyInput'

interface PropertyOption {
  id: string
  name: string
}

interface PropertyBooking {
  id: string
  checkIn: string
  checkOut: string
}

interface PayLinkQuota {
  used: number
  limit: number | null
  remaining: number | null
  unlimited: boolean
}

interface QuoteResult {
  nights: number
  nightlyRateNgn: number
  stayAmountNgn: number
  platformFeeNgn: number
  vatNgn: number
  guestTotalNgn: number
  payUrl: string
  expiresAt: string
  policy: {
    refunds: string
  }
  booking: {
    id: string
    guestName: string
  }
}

interface BookingQuoteDialogProps {
  open: boolean
  onClose: () => void
  properties: PropertyOption[]
  defaultPropertyId?: string
  atPayLinkLimit?: boolean
}

export function BookingQuoteDialog({
  open,
  onClose,
  properties,
  defaultPropertyId = '',
  atPayLinkLimit = false,
}: BookingQuoteDialogProps) {
  const api = useApi()
  const { token } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { bookingPayLinkLimit, hasUnlimitedBookingPayLinks, planLabel } = usePlanFeatures()

  const [guestName, setGuestName] = useState('')
  const [propertyId, setPropertyId] = useState(defaultPropertyId)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [nightlyRate, setNightlyRate] = useState('')
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [formError, setFormError] = useState('')
  const [dateError, setDateError] = useState('')
  const [payoutForm, setPayoutForm] = useState<PayoutFormValues>(emptyPayoutForm)

  const payoutStatusQuery = usePayoutStatus(open)

  useEffect(() => {
    if (!open) return
    setPropertyId(defaultPropertyId || properties[0]?.id || '')
    setGuestName('')
    setCheckIn('')
    setCheckOut('')
    setNightlyRate('')
    setResult(null)
    setFormError('')
    setDateError('')
    setPayoutForm(emptyPayoutForm())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-only reset
  }, [open])

  const { data: propertyBookings = [] } = useQuery({
    queryKey: ['bookings', 'availability', propertyId],
    queryFn: () =>
      apiRequestPaginated<PropertyBooking>(
        `/bookings?propertyId=${propertyId}&limit=500`,
        { token: token! },
      ).then((res) => res.data),
    enabled: Boolean(token && open && propertyId),
  })

  const { data: quota } = useQuery({
    queryKey: ['booking-payments', 'quota'],
    queryFn: () => api<PayLinkQuota>('/booking-payments/quota'),
    enabled: Boolean(token && open),
  })

  const bookedRanges = useMemo(
    () => upcomingBookedRanges(propertyBookings),
    [propertyBookings],
  )

  const availableRanges = useMemo(() => {
    const { fromDate, toDate } = defaultAvailabilityWindow(propertyBookings)
    return computeAvailableStayRanges(propertyBookings, fromDate, toDate)
  }, [propertyBookings])

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setDateError('')
      return
    }
    setDateError(validateBookingDates(checkIn, checkOut, propertyBookings) ?? '')
  }, [checkIn, checkOut, propertyBookings])

  const preview = useMemo(() => {
    const rate = parseMoneyInput(nightlyRate)
    if (!checkIn || !checkOut || rate <= 0) return null
    const { nights, stayAmountNgn } = computeStayTotalFromNightlyRate(checkIn, checkOut, rate)
    if (nights < 1) return null
    const checkout = computeBookingCheckoutTotals(stayAmountNgn, nights)
    return { nights, rate, ...checkout }
  }, [checkIn, checkOut, nightlyRate])

  const limitReached = atPayLinkLimit || (quota != null && !quota.unlimited && (quota.remaining ?? 0) <= 0)

  const createMutation = useMutation({
    mutationFn: () => {
      const availabilityError = validateBookingDates(checkIn, checkOut, propertyBookings)
      if (availabilityError) {
        throw new Error(availabilityError)
      }
      const payoutError = validatePayoutForm(payoutStatusQuery.data, payoutForm)
      if (payoutError) {
        throw new Error(payoutError)
      }
      const rate = parseMoneyInput(nightlyRate)
      const payout = payoutPayloadOrUndefined(payoutStatusQuery.data, payoutForm)
      return api<QuoteResult>('/booking-payments/quotes', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          guestName: guestName.trim(),
          checkIn,
          checkOut,
          nightlyRateNgn: rate,
          ...(payout
            ? {
                payout: {
                  businessName: payout.businessName.trim(),
                  bankCode: payout.bankCode,
                  accountNumber: payout.accountNumber.trim(),
                },
              }
            : {}),
        }),
      })
    },
    onSuccess: (data) => {
      setResult(data)
      setFormError('')
      showToast('Payment link ready to share')
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['booking-payments', 'quota'] })
      void queryClient.invalidateQueries({ queryKey: ['payouts', 'status'] })
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not create payment link',
      )
    },
  })

  function resetForm() {
    setGuestName('')
    setPropertyId(defaultPropertyId)
    setCheckIn('')
    setCheckOut('')
    setNightlyRate('')
    setResult(null)
    setFormError('')
    setDateError('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  const canSubmit =
    guestName.trim().length >= 2 &&
    Boolean(propertyId) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    Boolean(preview) &&
    !dateError &&
    !limitReached &&
    !createMutation.isPending

  return (
    <Dialog open={open} onClose={handleClose} title="Share payment link">
      <div className="flex flex-col gap-4">
        {!result ? (
          <>
            <Typography variant="body" className="text-muted-foreground">
              Enter available stay dates and the nightly rate for this booking. We’ll block dates
              that overlap an existing reservation, then create a Paystack link for your guest.
            </Typography>
            {!hasUnlimitedBookingPayLinks && bookingPayLinkLimit != null ? (
              <Typography variant="caption" className="text-muted-foreground">
                {planLabel} plan: {quota?.used ?? 0} / {bookingPayLinkLimit} payment links used
                {limitReached ? ' — upgrade to create more.' : '.'}
              </Typography>
            ) : null}
            {limitReached ? (
              <Typography variant="caption" className="text-destructive">
                You’ve reached your payment link limit.{' '}
                <a href="/settings#pricing" className="underline">
                  Upgrade your plan
                </a>{' '}
                to generate more.
              </Typography>
            ) : null}
            <Input
              label="Guest name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={limitReached}
            />
            <Select
              label="Property"
              value={propertyId}
              disabled={limitReached}
              onChange={(e) => {
                setPropertyId(e.target.value)
                setCheckIn('')
                setCheckOut('')
                setDateError('')
              }}
              options={properties.map((p) => ({ label: p.name, value: p.id }))}
              placeholder={properties.length === 0 ? 'No properties' : 'Select property'}
            />
            {propertyId ? (
              <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-2">
                <div>
                  <Typography variant="label" className="mb-2 block">
                    Available dates
                  </Typography>
                  {availableRanges.length === 0 ? (
                    <Typography variant="caption" className="text-muted-foreground">
                      No open nights in the next 12 months.
                    </Typography>
                  ) : (
                    <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                      {availableRanges.map((range) => (
                        <li
                          key={`available-${range.checkIn}-${range.checkOut}`}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check
                            className="mt-0.5 size-3.5 shrink-0 text-secondary"
                            aria-hidden
                          />
                          <span>{formatBlockedRange(range)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <Typography variant="label" className="mb-2 block">
                    Booked dates
                  </Typography>
                  {bookedRanges.length === 0 ? (
                    <Typography variant="caption" className="text-muted-foreground">
                      No upcoming bookings.
                    </Typography>
                  ) : (
                    <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                      {bookedRanges.map((range) => (
                        <li
                          key={`booked-${range.checkIn}-${range.checkOut}`}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          <span>{formatBlockedRange(range)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Check-in"
                type="date"
                value={checkIn}
                disabled={limitReached || !propertyId}
                onChange={(e) => {
                  const value = e.target.value
                  setCheckIn(value)
                  if (checkOut && value && checkOut <= value) setCheckOut('')
                }}
                error={dateError && checkIn ? dateError : undefined}
              />
              <Input
                label="Check-out"
                type="date"
                value={checkOut}
                disabled={limitReached || !propertyId || !checkIn}
                min={minCheckOutDate(checkIn)}
                onChange={(e) => setCheckOut(e.target.value)}
                error={dateError && checkOut ? dateError : undefined}
              />
            </div>
            <MoneyInput
              label="Amount per night (NGN)"
              value={nightlyRate}
              onValueChange={setNightlyRate}
              placeholder="Enter rate for this stay"
              disabled={limitReached}
            />
            <Typography variant="caption" className="text-muted-foreground">
              Not saved as a default — enter it each time you create a payment link.
            </Typography>
            <PayoutDetailsFields
              open={open && !result}
              values={payoutForm}
              onChange={setPayoutForm}
              disabled={limitReached}
            />
            {preview && !dateError ? (
              <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span>
                    {preview.nights} night{preview.nights === 1 ? '' : 's'} ×{' '}
                    {formatNaira(preview.rate)}
                  </span>
                  <strong>{formatNaira(preview.stayAmountNgn)}</strong>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>
                    Service fee (₦{BOOKING_PLATFORM_FEE_PER_NIGHT_NGN.toLocaleString()} ×{' '}
                    {preview.nights} night{preview.nights === 1 ? '' : 's'})
                  </span>
                  <strong>{formatNaira(preview.platformFeeNgn)}</strong>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>VAT ({BOOKING_VAT_PERCENT}% on fee)</span>
                  <strong>{formatNaira(preview.vatNgn)}</strong>
                </div>
                <div className="mt-2 flex justify-between gap-2 border-t border-border pt-2">
                  <span>Guest pays</span>
                  <strong>{formatNaira(preview.totalNgn)}</strong>
                </div>
              </div>
            ) : null}
            {formError ? (
              <Typography variant="caption" className="text-destructive">
                {formError}
              </Typography>
            ) : null}
            <Button
              loading={createMutation.isPending}
              disabled={!canSubmit}
              onClick={() => createMutation.mutate()}
            >
              Create &amp; get payment link
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
              <Typography variant="label" className="mb-2 block">
                {result.booking.guestName}
              </Typography>
              <div className="flex justify-between gap-2">
                <span>
                  {result.nights} night{result.nights === 1 ? '' : 's'} ×{' '}
                  {formatNaira(result.nightlyRateNgn)}
                </span>
                <strong>{formatNaira(result.stayAmountNgn)}</strong>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <span>
                  Service fee (₦{BOOKING_PLATFORM_FEE_PER_NIGHT_NGN.toLocaleString()} ×{' '}
                  {result.nights} night{result.nights === 1 ? '' : 's'})
                </span>
                <strong>{formatNaira(result.platformFeeNgn)}</strong>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <span>VAT ({BOOKING_VAT_PERCENT}% on fee)</span>
                <strong>{formatNaira(result.vatNgn)}</strong>
              </div>
              <div className="mt-2 flex justify-between gap-2 border-t border-border pt-2">
                <span>Guest pays</span>
                <strong>{formatNaira(result.guestTotalNgn)}</strong>
              </div>
            </div>
            <Input label="Share this link" value={result.payUrl} readOnly />
            <Typography variant="caption" className="text-muted-foreground">
              Expires {new Date(result.expiresAt).toLocaleString()}. {result.policy.refunds}
            </Typography>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(result.payUrl)
                  showToast('Payment link copied')
                }}
              >
                Copy link
              </Button>
              <Button
                variant="outlined"
                onClick={async () => {
                  const text = encodeURIComponent(
                    `Hi ${result.booking.guestName}, here is your HostsLedger payment link for your stay:\n${result.payUrl}`,
                  )
                  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
                }}
              >
                Share on WhatsApp
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setResult(null)
                  setNightlyRate('')
                  setGuestName('')
                  setCheckIn('')
                  setCheckOut('')
                  setFormError('')
                  setDateError('')
                }}
              >
                New link (new rate)
              </Button>
              <Button variant="outlined" onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
