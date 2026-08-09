import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Button, Card, Input, Select, Typography } from '../components'
import { useAuth, type User } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import {
  PLAN_LABELS,
  normalizeUserPlan,
  type BillingInterval,
  type UserPlan,
} from '@staypilot/shared'
import { SITE_URL } from '../lib/urls'

function formatSubscriptionEnd(value: string | null | undefined) {
  if (!value) return null
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminPage() {
  const api = useApi()
  const { user, token, sessionReady, logout } = useAuth()
  const { showToast } = useToast()

  const [lookupEmail, setLookupEmail] = useState('')
  const [queryEmail, setQueryEmail] = useState('')
  const [plan, setPlan] = useState<UserPlan>('GROWTH')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')

  const lookupQuery = useQuery({
    queryKey: ['admin', 'user', queryEmail],
    queryFn: () => api<{ user: User }>(`/auth/admin/users?email=${encodeURIComponent(queryEmail)}`),
    enabled: Boolean(token && queryEmail),
    retry: false,
  })

  const foundUser = lookupQuery.data?.user

  useEffect(() => {
    if (!foundUser) return
    setPlan(normalizeUserPlan(foundUser.plan))
    setBillingInterval(foundUser.billingInterval ?? 'monthly')
  }, [foundUser])

  const upgradeMutation = useMutation({
    mutationFn: () =>
      api<{ user: User }>('/auth/admin/users/plan', {
        method: 'PATCH',
        body: JSON.stringify({
          email: queryEmail,
          plan,
          billingInterval: plan === 'STARTER' ? undefined : billingInterval,
        }),
      }),
    onSuccess: (data) => {
      showToast(`Updated ${data.user.email} to ${PLAN_LABELS[normalizeUserPlan(data.user.plan)]}`)
      void lookupQuery.refetch()
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Upgrade failed', 'error')
    },
  })

  const intervalLabel = useMemo(() => {
    if (billingInterval === 'monthly') return '1 month'
    if (billingInterval === 'biannual') return '6 months'
    return '12 months'
  }, [billingInterval])

  if (!sessionReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Typography variant="caption">Loading…</Typography>
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login?redirect=/admin" replace />
  }

  if (!user.isPlatformAdmin) {
    return <Navigate to="/" replace />
  }

  const endsAt = formatSubscriptionEnd(foundUser?.subscriptionEndsAt)
  const lookupError =
    lookupQuery.isError && queryEmail
      ? 'No account found for that email.'
      : null

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0.06),_transparent_55%)]"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <a
            href={SITE_URL}
            aria-label="HostsLedger home"
            className="flex items-center gap-2.5"
          >
            <span className="grid size-9 place-items-center rounded-[9px] bg-primary-900 text-tertiary">
              <BarChart3 className="size-5" aria-hidden />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              HostsLedger
            </span>
          </a>
          <Button variant="ghost" size="sm" onClick={logout} allowWhenReadOnly>
            Log out
          </Button>
        </div>

        <Card className="flex flex-col gap-6">
          <div>
            <Typography variant="h2">Admin</Typography>
            <Typography variant="caption" className="mt-1 block">
              Look up a customer and update their plan after a manual payment.
            </Typography>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              const next = lookupEmail.trim().toLowerCase()
              if (!next) return
              setQueryEmail(next)
            }}
          >
            <div className="flex items-end gap-2">
              <Input
                label="Customer email"
                type="email"
                value={lookupEmail}
                onChange={(event) => setLookupEmail(event.target.value)}
                placeholder="customer@example.com"
                autoComplete="email"
                required
                error={lookupError ?? undefined}
                className="min-w-0"
              />
              <Button
                type="submit"
                className="shrink-0 whitespace-nowrap"
                loading={lookupQuery.isFetching}
              >
                Look up
              </Button>
            </div>
          </form>

          {foundUser ? (
            <div className="flex flex-col gap-5 border-t border-border pt-5">
              <div>
                <Typography variant="label">{foundUser.name}</Typography>
                <Typography variant="caption" className="mt-0.5 block">
                  {foundUser.email}
                </Typography>
                <Typography variant="body" className="mt-3">
                  {PLAN_LABELS[normalizeUserPlan(foundUser.plan)]}
                  {foundUser.billingInterval ? ` · ${foundUser.billingInterval}` : ''}
                  {endsAt ? ` · ends ${endsAt}` : ''}
                </Typography>
              </div>

              <Select
                label="New plan"
                value={plan}
                options={[
                  { label: 'Starter', value: 'STARTER' },
                  { label: 'Growth', value: 'GROWTH' },
                  { label: 'Pro', value: 'PRO' },
                ]}
                onChange={(event) => setPlan(event.target.value as UserPlan)}
              />

              {plan !== 'STARTER' ? (
                <Select
                  label="Billing period"
                  value={billingInterval}
                  options={[
                    { label: 'Monthly (1 month)', value: 'monthly' },
                    { label: 'Bi-annual (6 months)', value: 'biannual' },
                    { label: 'Annual (12 months)', value: 'annual' },
                  ]}
                  onChange={(event) =>
                    setBillingInterval(event.target.value as BillingInterval)
                  }
                />
              ) : null}

              <Typography variant="caption">
                {plan === 'STARTER'
                  ? 'Downgrades to Starter and clears paid access.'
                  : `Sets ${PLAN_LABELS[plan]} for ${intervalLabel} from today.`}
              </Typography>

              <Button
                className="w-full"
                loading={upgradeMutation.isPending}
                onClick={() => upgradeMutation.mutate()}
              >
                Save plan
              </Button>
            </div>
          ) : null}
        </Card>

        <Typography variant="caption" className="mt-4 text-center">
          Signed in as {user.email}
        </Typography>
      </div>
    </div>
  )
}
