import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Dialog, Input, Typography } from './index'
import { ApiError, formatNaira } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'

interface PayLinkResult {
  payUrl: string
  expiresAt: string
  stayAmountNgn: number
  platformFeeNgn: number
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
}

export function BookingPayLinkDialog({
  open,
  onClose,
  bookingId,
  guestName,
}: BookingPayLinkDialogProps) {
  const api = useApi()
  const { showToast } = useToast()
  const [result, setResult] = useState<PayLinkResult | null>(null)

  const createMutation = useMutation({
    mutationFn: () =>
      api<PayLinkResult>('/booking-payments/pay-links', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      }),
    onSuccess: (data) => {
      setResult(data)
      showToast(data.reused ? 'Existing payment link ready' : 'Payment link created')
    },
    onError: (error) => {
      showToast(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not create payment link',
        'error',
      )
    },
  })

  function handleOpenChange(next: boolean) {
    if (!next) {
      setResult(null)
      onClose()
      return
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => handleOpenChange(false)}
      title={`Collect payment · ${guestName}`}
    >
      <div className="flex flex-col gap-4">
        {!result ? (
          <>
            <Typography variant="body" className="text-muted-foreground">
              Create a shareable Paystack link. The guest pays the stay amount plus HostsLedger’s
              service fee; the stay amount settles to your connected bank account.
            </Typography>
            <Button
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create payment link
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span>Stay</span>
                <strong>{formatNaira(result.stayAmountNgn)}</strong>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <span>Service fee (guest)</span>
                <strong>{formatNaira(result.platformFeeNgn)}</strong>
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
              <Button variant="outlined" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
