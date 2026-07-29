import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { getPlanDefinition, PLAN_LABELS, type PaidPlan, type UserPlan } from '@staypilot/shared'
import { Button, Typography } from '../index'
import { ApiError, formatNaira } from '../../api/client'
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
  const { showToast } = useToast()
  const titleId = useId()
  const planDefinition = getPlanDefinition(targetPlan)

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
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <Typography id={titleId} variant="h3" className="text-primary-900">
            Upgrade to {planDefinition.name}
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

        <div className="overflow-y-auto p-6">
          <div className="flex flex-col gap-5">
            <div>
              <Typography variant="h2" className="text-3xl">
                {formatNaira(planDefinition.priceNgn)}
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </Typography>
              <Typography variant="caption" className="mt-1 block text-muted-foreground">
                You’ll complete payment securely in Paystack (card, bank, or USSD).
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

            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <Typography variant="label">Total due today</Typography>
              <Typography variant="h4">{formatNaira(planDefinition.priceNgn)}</Typography>
            </div>

            <PaystackBadge />

            <Button
              variant="inverted"
              size="lg"
              className="w-full"
              allowWhenReadOnly
              loading={isBusy}
              onClick={() => payMutation.mutate()}
            >
              Pay with Paystack
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
