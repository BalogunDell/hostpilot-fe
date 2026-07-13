import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import {
  comparePlans,
  normalizeUserPlan,
  PLAN_CATALOG,
  type PaidPlan,
  type UserPlan,
} from '@staypilot/shared'
import { Button, Card, Typography } from '../index'
import { ApiError, formatNaira } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { cn } from '../../lib/cn'
import { UpgradePaymentModal } from './UpgradePaymentModal'

interface PlanCardProps {
  name: string
  subtitle: string
  priceLabel: string
  features: readonly string[]
  isCurrent: boolean
  badge?: string
  action?: {
    label: string
    variant?: 'primary' | 'secondary'
    onClick?: () => void
    loading?: boolean
  }
}

function PlanCard({
  name,
  subtitle,
  priceLabel,
  features,
  isCurrent,
  badge,
  action,
}: PlanCardProps) {
  return (
    <Card
      padding="md"
      className={cn(
        'flex h-full flex-col gap-3',
        isCurrent && 'border-2 border-secondary ring-1 ring-secondary/20',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography variant="caption" className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {subtitle}
          </Typography>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Typography variant="label" className="text-base">
              {name}
            </Typography>
            <Typography
              variant="caption"
              className={cn('font-semibold', isCurrent && 'text-secondary')}
            >
              {priceLabel}
              {priceLabel !== '₦0' ? <span className="font-normal opacity-70">/mo</span> : null}
            </Typography>
          </div>
        </div>
        {isCurrent ? (
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Current
          </span>
        ) : badge ? (
          <span className="shrink-0 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-semibold text-secondary">
            {badge}
          </span>
        ) : null}
      </div>

      <ul className="grid flex-1 grid-cols-1 gap-1.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-1.5 text-xs text-foreground">
            <Check className="mt-0.5 size-3 shrink-0 text-secondary" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {action ? (
        <Button
          size="sm"
          variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
          className="mt-auto w-full"
          loading={action.loading}
          allowWhenReadOnly
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </Card>
  )
}

export function SettingsPlansSection() {
  const api = useApi()
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null)

  const currentPlan = normalizeUserPlan(user?.plan ?? 'STARTER')

  const downgradeMutation = useMutation({
    mutationFn: () =>
      api<{ user: { plan: UserPlan; readOnly: boolean } }>('/auth/me/plan', {
        method: 'PATCH',
        body: JSON.stringify({ plan: 'STARTER' }),
      }),
    onSuccess: async () => {
      await refreshUser()
      showToast('Plan updated to Starter')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to update plan'
      showToast(message, 'error')
    },
  })

  useEffect(() => {
    const reference = searchParams.get('reference') ?? searchParams.get('trxref')
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus !== 'success' || !reference) {
      return
    }

    let cancelled = false

    async function verifyReturnPayment() {
      try {
        await api<{ user: { plan: UserPlan; readOnly: boolean } }>(
          `/payments/verify/${encodeURIComponent(reference!)}`,
        )
        if (cancelled) return
        await refreshUser()
        showToast('Payment successful. Your plan is now active!')
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Payment verification failed'
        showToast(message, 'error')
      } finally {
        if (cancelled) return
        setSearchParams(
          (current) => {
            const next = new URLSearchParams(current)
            next.delete('payment')
            next.delete('reference')
            next.delete('trxref')
            return next
          },
          { replace: true },
        )
      }
    }

    void verifyReturnPayment()

    return () => {
      cancelled = true
    }
  }, [api, refreshUser, searchParams, setSearchParams, showToast])

  function getPlanAction(planId: UserPlan) {
    if (planId === currentPlan) {
      return undefined
    }

    if (planId === 'STARTER') {
      return {
        label: 'Downgrade',
        variant: 'secondary' as const,
        loading: downgradeMutation.isPending,
        onClick: () => downgradeMutation.mutate(),
      }
    }

    if (comparePlans(planId, currentPlan) > 0) {
      return {
        label: `Upgrade to ${PLAN_CATALOG.find((plan) => plan.id === planId)?.name ?? planId}`,
        onClick: () => setSelectedPlan(planId as PaidPlan),
      }
    }

    return undefined
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLAN_CATALOG.map((plan) => (
          <PlanCard
            key={plan.id}
            name={plan.name}
            subtitle={plan.subtitle}
            priceLabel={plan.priceNgn === 0 ? '₦0' : formatNaira(plan.priceNgn)}
            features={plan.features}
            isCurrent={currentPlan === plan.id}
            badge={plan.recommended && currentPlan !== plan.id ? 'Recommended' : undefined}
            action={getPlanAction(plan.id)}
          />
        ))}
      </div>

      {selectedPlan ? (
        <UpgradePaymentModal
          open={Boolean(selectedPlan)}
          targetPlan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => refreshUser()}
        />
      ) : null}
    </>
  )
}
