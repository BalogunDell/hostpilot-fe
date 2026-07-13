import { Badge, Typography } from '../index'
import { PLAN_LABELS, normalizeUserPlan } from '@staypilot/shared'
import { AppLink } from '../../context/AppNavigation'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

export function SidebarPlanPill() {
  const { user } = useAuth()
  const { readOnly } = useApp()

  if (!user) return null

  const plan = normalizeUserPlan(user.plan)
  const label = readOnly ? 'Expired' : PLAN_LABELS[plan]
  const variant = readOnly ? 'warning' : plan === 'STARTER' ? 'default' : 'info'

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <Typography variant="caption" className="text-muted-foreground">
        Plan:
      </Typography>
      <AppLink to="/settings#pricing" allowWhenReadOnly className="inline-flex shrink-0">
        <Badge variant={variant} className="text-[10px] uppercase tracking-wide">
          {label}
        </Badge>
      </AppLink>
    </div>
  )
}
