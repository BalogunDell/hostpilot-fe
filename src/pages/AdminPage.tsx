import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Card, Input, Select, Typography } from '../components'
import { useAuth, type User } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import type { BillingInterval, UserPlan } from '@staypilot/shared'

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
      showToast(`Updated ${data.user.email} to ${data.user.plan}`)
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
      <div className="flex min-h-svh items-center justify-center">
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

  return (
    <div className="min-h-svh bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Typography variant="h2">Admin</Typography>
            <Typography variant="caption" className="mt-1 block text-muted-foreground">
              Signed in as {user.email}
            </Typography>
          </div>
          <Button variant="outlined" onClick={logout}>
            Log out
          </Button>
        </div>

        <Card className="flex flex-col gap-4">
          <Typography variant="h4">Find user</Typography>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              setQueryEmail(lookupEmail.trim().toLowerCase())
            }}
          >
            <Input
              label="User email"
              type="email"
              value={lookupEmail}
              onChange={(event) => setLookupEmail(event.target.value)}
              placeholder="customer@example.com"
              required
            />
            <Button type="submit" className="sm:mt-7" loading={lookupQuery.isFetching}>
              Look up
            </Button>
          </form>

          {lookupQuery.isError ? (
            <Typography variant="caption" className="text-destructive">
              {lookupQuery.error instanceof Error
                ? lookupQuery.error.message
                : 'User not found'}
            </Typography>
          ) : null}

          {foundUser ? (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <Typography variant="label">{foundUser.name}</Typography>
              <Typography variant="caption" className="mt-1 block text-muted-foreground">
                {foundUser.email}
              </Typography>
              <Typography variant="caption" className="mt-2 block">
                Current plan: <strong>{foundUser.plan}</strong>
                {foundUser.billingInterval ? ` · ${foundUser.billingInterval}` : ''}
                {foundUser.subscriptionEndsAt
                  ? ` · ends ${new Date(foundUser.subscriptionEndsAt).toLocaleDateString()}`
                  : ''}
              </Typography>
            </div>
          ) : null}
        </Card>

        {foundUser ? (
          <Card className="flex flex-col gap-4">
            <Typography variant="h4">Update plan</Typography>
            <Select
              label="Plan"
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
            <Typography variant="caption" className="text-muted-foreground">
              {plan === 'STARTER'
                ? 'Downgrades the user to Starter and clears paid access.'
                : `Sets ${plan} for ${intervalLabel} from today.`}
            </Typography>
            <Button
              loading={upgradeMutation.isPending}
              onClick={() => upgradeMutation.mutate()}
            >
              Save plan
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
