import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BOOKING_PLATFORM_FEE_PER_NIGHT_NGN } from '@staypilot/shared'
import { Button, Card, Input, Typography } from '../components'
import { ApiError, apiRequest, formatNaira } from '../api/client'
import { openPaystackCheckout } from '../lib/paystack'

interface PayPageData {
  status: 'pending' | 'success' | 'failed' | 'expired'
  expiresAt: string
  guestName: string
  propertyName: string
  checkIn: string
  checkOut: string
  nights: number
  stayAmountNgn: number
  platformFeeNgn: number
  totalNgn: number
  currency: 'NGN'
  policy: {
    summary: string
    failedPayments: string
    holds: string
    refunds: string
  }
}

interface CheckoutInit {
  publicKey: string
  email: string
  amountKobo: number
  reference: string
  accessCode: string
}

export function PayBookingPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)

  const pageQuery = useQuery({
    queryKey: ['public-pay', token],
    queryFn: () => apiRequest<PayPageData>(`/public/pay/${token}`),
    enabled: Boolean(token),
    retry: false,
  })

  const verifyMutation = useMutation({
    mutationFn: (reference: string) =>
      apiRequest<{ alreadyVerified: boolean }>(`/public/pay/${token}/verify/${reference}`),
    onSuccess: () => {
      setPaid(true)
      setError('')
      void pageQuery.refetch()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Could not verify payment')
    },
  })

  const initMutation = useMutation({
    mutationFn: () =>
      apiRequest<CheckoutInit>(`/public/pay/${token}/initialize`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      }),
    onSuccess: async (checkout) => {
      setError('')
      try {
        await openPaystackCheckout({
          publicKey: checkout.publicKey,
          email: checkout.email,
          amountKobo: checkout.amountKobo,
          reference: checkout.reference,
          accessCode: checkout.accessCode,
          onSuccess: (reference) => {
            verifyMutation.mutate(reference)
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not open Paystack')
      }
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not start payment',
      )
    },
  })

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (searchParams.get('payment') === 'success' && reference && token) {
      verifyMutation.mutate(reference)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on return URL
  }, [token])

  if (!token || pageQuery.isError) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-lg text-center">
          <Typography variant="h3">Payment link not found</Typography>
          <Typography variant="body" className="mt-2 text-muted-foreground">
            This link is invalid or no longer available. Ask your host for a new payment link.
          </Typography>
          <div className="mt-6">
            <Link to="/">
              <Button allowWhenReadOnly>Go to HostsLedger</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (pageQuery.isLoading || !pageQuery.data) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Typography variant="body">Loading payment…</Typography>
      </div>
    )
  }

  const data = pageQuery.data
  const alreadyPaid = paid || data.status === 'success'

  return (
    <div className="min-h-svh bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <Card padding="lg" className="flex flex-col gap-4">
          <Typography variant="caption" className="text-muted-foreground">
            HostsLedger guest checkout
          </Typography>
          <Typography variant="h3">{data.propertyName}</Typography>
          <Typography variant="body" className="text-muted-foreground">
            Stay for {data.guestName}: {data.checkIn} → {data.checkOut}
          </Typography>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex justify-between gap-3 text-sm">
              <span>Stay</span>
              <strong>{formatNaira(data.stayAmountNgn)}</strong>
            </div>
            <div className="mt-2 flex justify-between gap-3 text-sm">
              <span>
                Service fee
                {data.nights > 0
                  ? ` (₦${BOOKING_PLATFORM_FEE_PER_NIGHT_NGN.toLocaleString()} × ${data.nights} night${data.nights === 1 ? '' : 's'})`
                  : ''}
              </span>
              <strong>{formatNaira(data.platformFeeNgn)}</strong>
            </div>
            <div className="mt-3 flex justify-between gap-3 border-t border-border pt-3 text-base">
              <span>Total</span>
              <strong>{formatNaira(data.totalNgn)}</strong>
            </div>
          </div>

          {alreadyPaid ? (
            <Typography variant="body" className="text-green-700">
              Payment received. Thank you — your host has been notified.
            </Typography>
          ) : data.status === 'expired' || data.status === 'failed' ? (
            <Typography variant="body" className="text-destructive">
              This payment link is no longer active. Ask your host to send a new one.
            </Typography>
          ) : (
            <>
              <Input
                label="Your email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="For your payment receipt"
                required
              />
              {error ? (
                <Typography variant="caption" className="text-destructive">
                  {error}
                </Typography>
              ) : null}
              <Button
                loading={initMutation.isPending || verifyMutation.isPending}
                onClick={() => {
                  if (!email.trim()) {
                    setError('Enter your email to continue.')
                    return
                  }
                  initMutation.mutate()
                }}
              >
                Pay {formatNaira(data.totalNgn)}
              </Button>
            </>
          )}
        </Card>

        <Card padding="md" className="flex flex-col gap-2">
          <Typography variant="label">Payment notes</Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {data.policy.summary}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {data.policy.holds}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {data.policy.failedPayments}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {data.policy.refunds}
          </Typography>
        </Card>
      </div>
    </div>
  )
}
