import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import {
  BILLING_INTERVALS,
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVAL_MONTHS,
  getBillingSavingsPercent,
  getPlanCheckoutPriceNgn,
  getPlanDefinition,
  getPlanFullPrepaidPriceNgn,
  PLAN_LABELS,
  type BillingInterval,
  type PaidPlan,
  type UserPlan,
} from '@staypilot/shared'
import { Button, Typography } from '../index'
import { ApiError, formatNaira } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { cn } from '../../lib/cn'
import { openPaystackCheckout } from '../../lib/paystack'

interface CheckoutSession {
  plan: PaidPlan
  interval: BillingInterval
  months: number
  publicKey: string
  email: string
  amountKobo: number
  amountNgn: number
  monthlyPriceNgn: number
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
  const [interval, setInterval] = useState<BillingInterval>('monthly')

  useEffect(() => {
    if (!open) return
    setInterval('monthly')
  }, [open, targetPlan])

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

  const checkoutTotal = useMemo(
    () => getPlanCheckoutPriceNgn(targetPlan, interval),
    [targetPlan, interval],
  )
  const fullTotal = useMemo(
    () => getPlanFullPrepaidPriceNgn(targetPlan, interval),
    [targetPlan, interval],
  )
  const savingsPercent = getBillingSavingsPercent(interval)
  const months = BILLING_INTERVAL_MONTHS[interval]

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
        body: JSON.stringify({ plan: targetPlan, interval }),
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
                One-time payment for the period you choose. No automatic renewal.
              </Typography>
            </div>

            <fieldset className="flex flex-col gap-2">
              <Typography variant="label" className="text-sm">
                Billing period
              </Typography>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {BILLING_INTERVALS.map((option) => {
                  const optionTotal = getPlanCheckoutPriceNgn(targetPlan, option)
                  const optionSavings = getBillingSavingsPercent(option)
                  const selected = interval === option
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isBusy}
                      onClick={() => setInterval(option)}
                      className={cn(
                        'rounded-lg border px-3 py-3 text-left transition',
                        selected
                          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/30'
                          : 'border-border hover:border-secondary/40',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {BILLING_INTERVAL_LABELS[option]}
                        </span>
                        {optionSavings > 0 ? (
                          <span className="rounded-full bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                            Save {optionSavings}%
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm font-medium">{formatNaira(optionTotal)}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {BILLING_INTERVAL_MONTHS[option] === 1
                          ? '1 month access'
                          : `${BILLING_INTERVAL_MONTHS[option]} months access`}
                      </div>
                    </button>
                  )
                })}
              </div>
            </fieldset>

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

            <div className="flex flex-col gap-1 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4">
                <Typography variant="label">Total due today</Typography>
                <Typography variant="h4">{formatNaira(checkoutTotal)}</Typography>
              </div>
              {savingsPercent > 0 ? (
                <Typography variant="caption" className="text-right text-muted-foreground">
                  Was {formatNaira(fullTotal)} · you save {savingsPercent}% for {months} months
                </Typography>
              ) : (
                <Typography variant="caption" className="text-right text-muted-foreground">
                  Covers {months === 1 ? '1 month' : `${months} months`} of {planDefinition.name}
                </Typography>
              )}
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
