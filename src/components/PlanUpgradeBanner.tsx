import { PLAN_LABELS, type UserPlan } from '@staypilot/shared'
import { Card, Typography } from './index'

interface PlanUpgradeBannerProps {
  requiredPlan: UserPlan
  feature: string
  className?: string
}

export function PlanUpgradeBanner({
  requiredPlan,
  feature,
  className,
}: PlanUpgradeBannerProps) {
  const planName = PLAN_LABELS[requiredPlan]

  return (
    <Card padding="md" className={className ?? 'border-secondary-100 bg-secondary-50'}>
      <Typography variant="body">
        {feature} is available on the {planName} plan and above.{' '}
        <a
          href="/settings#pricing"
          data-allow-readonly-nav
          className="font-medium text-secondary hover:underline"
        >
          Upgrade to {planName}
        </a>
      </Typography>
    </Card>
  )
}
