import {
  BOOKING_PLATFORM_FEE_PER_NIGHT_NGN,
  BOOKING_VAT_PERCENT,
  computeBookingCheckoutTotals,
  computeStayTotalFromNightlyRate,
} from '@staypilot/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, Input, MoneyInput, Typography } from './index'
import {
  PayoutDetailsFields,
  payoutPayloadOrUndefined,
  usePayoutStatus,
  validatePayoutForm,
  type PayoutFormValues,
} from './PayoutDetailsFields'
import { ApiError, formatNaira } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { formatBookingDisplayDate } from '../lib/bookingDates'
import { parseMoneyInput } from '../lib/moneyInput'

interface PayLinkResult {
  payUrl: string
  expiresAt: string
  nights: number
  nightlyRateNgn: number
  stayAmountNgn: number
  platformFeeNgn: number
  vatNgn: number
  totalNgn: number
  reused?: boolean
  policy: {
    summary: string
    failedPayments: string
    holds: string
    refunds: string
  }
}

interface BookingPayLinkDialogProps {
  open: boolean
  onClose: () => void
  bookingId: string
  guestName: string
  checkIn: string
  checkOut: string
}

export function BookingPayLinkDialog({
  open,
  onClose,
  bookingId,
  guestName,
  checkIn,
  checkOut,
}: BookingPayLinkDialogProps) {
  const api = useApi()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [nightlyRate, setNightlyRate] = useState('')
  const [result, setResult] = useState<PayLinkResult | null>(null)
  const [formError, setFormError] = useState('')
  const [payoutForm, setPayoutForm] = useState<PayoutFormValues>({
    businessName: '',
    bankCode: '',
    accountNumber: '',
  })
  const payoutStatusQuery = usePayoutStatus(open)

  useEffect(() => {
    if (!open) return
    setNightlyRate('')
    setResult(null)
    setFormError('')
    setPayoutForm({ businessName: '', bankCode: '', accountNumber: '' })
  }, [open, bookingId])

  const preview = useMemo(() => {
    const rate = parseMoneyInput(nightlyRate)
    if (!checkIn || !checkOut || rate <= 0) return null
    const { nights, stayAmountNgn } = computeStayTotalFromNightlyRate(checkIn, checkOut, rate)
    if (nights < 1) return null
    const checkout = computeBookingCheckoutTotals(stayAmountNgn, nights)
    return { nights, rate, ...checkout }
  }, [checkIn, checkOut, nightlyRate])

  const createMutation = useMutation({
    mutationFn: () => {
      const payoutError = validatePayoutForm(payoutStatusQuery.data, payoutForm)
      if (payoutError) throw new Error(payoutError)
      const rate = parseMoneyInput(nightlyRate)
      const payout = payoutPayloadOrUndefined(payoutStatusQuery.data, payoutForm)
      return api<PayLinkResult>('/booking-payments/pay-links', {
        method: 'POST',
        body: JSON.stringify({
          bookingId,
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
      showToast(data.reused ? 'Existing payment link ready' : 'Payment link created')
      void queryClient.invalidateQueries({ queryKey: ['payouts', 'status'] })
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not create payment link'
      setFormError(message)
      showToast(message, 'error')
    },
  })

  function handleClose() {
    setNightlyRate('')
    setResult(null)
    setFormError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title={`Collect payment · ${guestName}`}>
      <div className="flex flex-col gap-4">
        {!result ? (
          <>
            <Typography variant="body" className="text-muted-foreground">
              Enter the nightly rate for this stay (it can differ each time). We’ll multiply by the
              number of nights and create a Paystack link for your guest.
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              {formatBookingDisplayDate(checkIn)} — {formatBookingDisplayDate(checkOut)}
            </Typography>
            <MoneyInput
              label="Amount per night (NGN)"
              value={nightlyRate}
              onValueChange={setNightlyRate}
              placeholder="45,000"
              autoFocus
            />
            <PayoutDetailsFields
              open={open && !result}
              values={payoutForm}
              onChange={setPayoutForm}
            />
            {preview ? (
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
              disabled={!preview || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create payment link
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
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
                <span>Guest total</span>
                <strong>{formatNaira(result.totalNgn)}</strong>
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
                    `Hi ${guestName}, here is your HostsLedger payment link for your stay:\n${result.payUrl}`,
                  )
                  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
                }}
              >
                Share on WhatsApp
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
