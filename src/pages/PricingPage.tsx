import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, Info, X } from 'lucide-react'
import { AppLink } from '../context/AppNavigation'
import { Button, Card, ProgressBar, Typography } from '../components'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { cn } from '../lib/cn'

const trustBrands = ['Skyline Suites', 'Azure Rentals', 'Retreat Haven', 'Metro Host']

const comparisonRows = [
  { feature: 'WhatsApp Guest Connectivity', free: true, pro: true, business: true },
  { feature: 'Dynamic Pricing AI', free: false, pro: true, business: true },
  { feature: 'Expense Tracking', free: true, pro: true, business: true },
  { feature: 'Custom Brand Theme', free: false, pro: true, business: true },
  { feature: 'White-labeled Guest Guidebook', free: false, pro: true, business: true },
] as const

function PlanFeature({
  included,
  label,
  highlight,
}: {
  included: boolean
  label: string
  highlight?: boolean
}) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {included ? (
        <Check
          className={cn('mt-0.5 size-4 shrink-0', highlight ? 'text-secondary' : 'text-tertiary-600')}
          aria-hidden
        />
      ) : (
        <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className={cn(!included && 'text-muted-foreground')}>{label}</span>
    </li>
  )
}

function ComparisonCell({ included }: { included: boolean }) {
  return included ? (
    <Check className="mx-auto size-5 text-secondary" aria-label="Included" />
  ) : (
    <X className="mx-auto size-5 text-muted-foreground" aria-label="Not included" />
  )
}

export function PricingPage({ embedded = false }: { embedded?: boolean }) {
  const api = useApi()
  const { user, token } = useAuth()

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api<Array<{ id: string }>>('/properties'),
    enabled: Boolean(token),
  })

  const propertyCount = properties?.length ?? 0
  const usedLabel =
    user?.plan === 'FREE'
      ? `${propertyCount} / 1 Properties Used`
      : `${propertyCount} Properties`

  return (
    <div className={cn('flex flex-col gap-8', !embedded && 'mx-auto max-w-6xl pb-8')}>
      {user?.plan === 'FREE' ? (
        <Card padding="md" className="flex flex-col gap-4 border-border bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary">
              <Info className="size-5" aria-hidden />
            </div>
            <div>
              <Typography variant="label">Current Plan: Free</Typography>
              <Typography variant="caption" className="mt-0.5 block">
                You&apos;ve reached your capacity limit for your current subscription.
              </Typography>
            </div>
          </div>
          <div className="w-full min-w-[200px] sm:max-w-xs">
            <ProgressBar value={propertyCount} max={1} label={usedLabel} />
          </div>
        </Card>
      ) : null}

      {!embedded ? (
        <div className="text-center">
          <Typography variant="h2">Elevate Your Portfolio</Typography>
          <Typography variant="body" className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Choose the co-pilot that matches your growth. Professional tools for professional
            managers.
          </Typography>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" className="flex flex-col">
          <Typography variant="caption" className="font-semibold uppercase tracking-wide text-muted-foreground">
            Basic Tier
          </Typography>
          <Typography variant="h3" className="mt-2">
            Free
          </Typography>
          <div className="mt-2 flex items-baseline gap-1">
            <Typography variant="h2">$0</Typography>
            <Typography variant="caption">/per month</Typography>
          </div>
          <ul className="mt-6 flex flex-1 flex-col gap-3">
            <PlanFeature included label="1 Property Managed" />
            <PlanFeature included label="Basic Guest Messaging" />
            <PlanFeature included label="Simple Calendar View" />
            <PlanFeature included={false} label="Real-time Sync" />
          </ul>
          <Button
            variant="secondary"
            className="mt-6 w-full"
            disabled={user?.plan === 'FREE'}
          >
            {user?.plan === 'FREE' ? 'Current Plan' : 'Downgrade'}
          </Button>
        </Card>

        <Card
          padding="lg"
          className="relative flex flex-col border-2 border-secondary shadow-md"
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
            Recommended
          </span>
          <Typography variant="caption" className="font-semibold uppercase tracking-wide text-secondary">
            Scaling Growth
          </Typography>
          <Typography variant="h3" className="mt-2">
            Pro
          </Typography>
          <div className="mt-2 flex items-baseline gap-1">
            <Typography variant="h2" className="text-secondary">
              $29
            </Typography>
            <Typography variant="caption">/per month</Typography>
          </div>
          <ul className="mt-6 flex flex-1 flex-col gap-3">
            <PlanFeature included highlight label="Unlimited Properties" />
            <PlanFeature included highlight label="Unlimited Co-hosts" />
            <PlanFeature included highlight label="Real-time Calendar sync" />
            <PlanFeature included highlight label="Custom white-labeled listings" />
          </ul>
          <Button className="mt-6 w-full" disabled={user?.plan === 'PRO'}>
            {user?.plan === 'PRO' ? 'Current Plan' : 'Upgrade to Pro'}
          </Button>
        </Card>

        <Card padding="lg" className="flex flex-col border-0 bg-primary-900 text-primary-foreground">
          <Typography variant="caption" className="font-semibold uppercase tracking-wide text-primary-foreground/70">
            Enterprise Focus
          </Typography>
          <Typography variant="h3" className="mt-2 text-primary-foreground">
            Business
          </Typography>
          <div className="mt-2 flex items-baseline gap-1">
            <Typography variant="h2" className="text-primary-foreground">
              $99
            </Typography>
            <Typography variant="caption" className="text-primary-foreground/70">
              /per month
            </Typography>
          </div>
          <ul className="mt-6 flex flex-1 flex-col gap-3">
            <PlanFeature included highlight label="Team management" />
            <PlanFeature included highlight label="Portfolio dashboard" />
            <PlanFeature included highlight label="Automated workflows" />
            <PlanFeature included highlight label="Priority support" />
          </ul>
          <Button
            variant="secondary"
            className="mt-6 w-full bg-card text-foreground hover:bg-card/90"
            disabled
          >
            Coming soon
          </Button>
        </Card>
      </div>

      <div className="text-center">
        <Typography variant="caption" className="font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by 2,000+ property managers
        </Typography>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-muted-foreground/60">
          {trustBrands.map((brand) => (
            <span key={brand}>{brand}</span>
          ))}
        </div>
      </div>

      <Card padding="md" className="overflow-x-auto">
        <Typography variant="h4" className="mb-4">
          Core Modules
        </Typography>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Feature</th>
              <th className="pb-3 px-4 text-center font-medium">Free</th>
              <th className="pb-3 px-4 text-center font-medium">Pro</th>
              <th className="pb-3 pl-4 text-center font-medium">Business</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.feature} className="border-b border-border last:border-0">
                <td className="py-3 pr-4">{row.feature}</td>
                <td className="px-4 py-3 text-center">
                  <ComparisonCell included={row.free} />
                </td>
                <td className="px-4 py-3 text-center">
                  <ComparisonCell included={row.pro} />
                </td>
                <td className="py-3 pl-4 text-center">
                  <ComparisonCell included={row.business} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Typography variant="body" className="text-center text-muted-foreground">
        Need help choosing?{' '}
        <AppLink to="/properties" className="inline-flex items-center gap-1 font-medium text-secondary hover:underline">
          Contact Sales Advisor
          <ArrowRight className="size-4" />
        </AppLink>
      </Typography>
    </div>
  )
}
