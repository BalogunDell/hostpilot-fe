import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { Check, CircleHelp, CreditCard, X } from 'lucide-react'
import { getPlanDefinition, PLAN_LABELS, type PaidPlan, type UserPlan } from '@staypilot/shared'
import { Button, Input, Typography } from '../index'
import { ApiError, formatNaira } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { openPaystackCheckout } from '../../lib/paystack'

interface CheckoutSession {
  plan: PaidPlan
  publicKey: string
  email: string
  amountKobo: number
  amountNgn: number
  currency: 'NGN'
  reference: string
  accessCode: string
  authorizationUrl: string
}

interface UpgradePaymentModalProps {
  open: boolean
  targetPlan: PaidPlan
  onClose: () => void
  onSuccess: () => void
}

function PaystackBadge() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Secured by</span>
      <span className="inline-flex items-center gap-1.5 font-semibold text-[#011B33]">
        <span className="flex flex-col gap-0.5" aria-hidden>
          <span className="block h-0.5 w-4 rounded-full bg-[#00C3F7]" />
          <span className="block h-0.5 w-4 rounded-full bg-[#00C3F7]" />
          <span className="block h-0.5 w-4 rounded-full bg-[#00C3F7]" />
        </span>
        paystack
      </span>
    </div>
  )
}

export function UpgradePaymentModal({
  open,
  targetPlan,
  onClose,
  onSuccess,
}: UpgradePaymentModalProps) {
  const api = useApi()
  const { user } = useAuth()
  const { showToast } = useToast()
  const titleId = useId()
  const [cardholderName, setCardholderName] = useState(user?.name ?? '')
  const planDefinition = getPlanDefinition(targetPlan)

  useEffect(() => {
    if (user?.name) {
      setCardholderName(user.name)
    }
  }, [user?.name])

  useEffect(() => {
    if (!open) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  const verifyMutation = useMutation({
    mutationFn: (reference: string) =>
      api<{ user: { plan: UserPlan; readOnly: boolean } }>(
        `/payments/verify/${encodeURIComponent(reference)}`,
      ),
    onSuccess: async () => {
      showToast(`Payment successful. Welcome to ${PLAN_LABELS[targetPlan]}!`)
      onSuccess()
      onClose()
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Payment verification failed'
      showToast(message, 'error')
    },
  })

  const payMutation = useMutation({
    mutationFn: () =>
      api<CheckoutSession>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({ plan: targetPlan }),
      }),
    onSuccess: async (checkout) => {
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to open Paystack checkout'
        showToast(message, 'error')
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to start payment'
      showToast(message, 'error')
    },
  })

  const isBusy = payMutation.isPending || verifyMutation.isPending

  function handleCompletePayment() {
    if (!cardholderName.trim()) {
      showToast('Enter the cardholder name', 'error')
      return
    }
    payMutation.mutate()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <Typography id={titleId} variant="h3" className="text-primary-900">
            StayPilot
          </Typography>
          <Button
            variant="ghost"
            size="icon-sm"
            allowWhenReadOnly
            onClick={onClose}
            aria-label="Close checkout"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-border">
            <section className="flex flex-col gap-5 p-6">
              <Typography variant="h4">Order Summary</Typography>

              <div>
                <Typography variant="label" className="text-base">
                  {planDefinition.name} Plan
                </Typography>
                <Typography variant="h2" className="mt-1 text-3xl">
                  {formatNaira(planDefinition.priceNgn)}
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </Typography>
              </div>

              <ul className="flex flex-col gap-3">
                {planDefinition.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-tertiary-50 text-tertiary-600">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto border-t border-border pt-4">
                <div className="flex items-center justify-between gap-4">
                  <Typography variant="label">Total Due Today:</Typography>
                  <Typography variant="h4">{formatNaira(planDefinition.priceNgn)}</Typography>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4 border-t border-border p-6 lg:border-t-0">
              <Typography variant="h4">Payment Details</Typography>

              <Input
                label="Cardholder Name"
                value={cardholderName}
                onChange={(event) => setCardholderName(event.target.value)}
                placeholder="John Doe"
                autoComplete="name"
              />

              <div className="relative">
                <Input
                  label="Card Number"
                  placeholder="XXXX XXXX XXXX XXXX"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  readOnly
                  onFocus={(event) => event.currentTarget.blur()}
                  className="cursor-pointer pl-10"
                  aria-describedby="paystack-card-note"
                />
                <CreditCard
                  className="pointer-events-none absolute left-3 top-[2.125rem] size-4 text-muted-foreground"
                  aria-hidden
                />
              </div>
              <Typography id="paystack-card-note" variant="caption" className="-mt-2 text-muted-foreground">
                Card, bank, and USSD payments are completed in Paystack&apos;s secure checkout.
              </Typography>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Expiry Date"
                  placeholder="MM / YY"
                  autoComplete="cc-exp"
                  readOnly
                  onFocus={(event) => event.currentTarget.blur()}
                  className="cursor-pointer"
                />
                <div className="relative">
                  <Input
                    label="CVV"
                    placeholder="XXX"
                    autoComplete="cc-csc"
                    readOnly
                    onFocus={(event) => event.currentTarget.blur()}
                    className="cursor-pointer pr-10"
                  />
                  <CircleHelp
                    className="pointer-events-none absolute right-3 top-[2.125rem] size-4 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </div>

              <PaystackBadge />

              <Button
                variant="inverted"
                size="lg"
                className="mt-auto w-full"
                allowWhenReadOnly
                loading={isBusy}
                onClick={handleCompletePayment}
              >
                Complete Payment
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
