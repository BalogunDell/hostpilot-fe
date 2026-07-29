/** Legacy FREE rows are normalized to STARTER (the free tier). */
export type UserPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO'

export type PaidPlan = 'GROWTH' | 'PRO'

export const USER_PLANS = ['FREE', 'STARTER', 'GROWTH', 'PRO'] as const satisfies readonly UserPlan[]

export const PAID_PLANS = ['GROWTH', 'PRO'] as const satisfies readonly PaidPlan[]

export const PLAN_RANK: Record<UserPlan, number> = {
  FREE: 0,
  STARTER: 0,
  GROWTH: 1,
  PRO: 2,
}

export const PLAN_PROPERTY_LIMITS: Record<UserPlan, number> = {
  FREE: 1,
  STARTER: 1,
  GROWTH: 3,
  PRO: 7,
}

/** Null = unlimited. Counted per calendar month. */
export const PLAN_BOOKING_LIMITS: Record<UserPlan, number | null> = {
  FREE: 5,
  STARTER: 5,
  GROWTH: null,
  PRO: null,
}

/** Null = unlimited. Counted per calendar month. */
export const PLAN_EXPENSE_LIMITS: Record<UserPlan, number | null> = {
  FREE: 5,
  STARTER: 5,
  GROWTH: null,
  PRO: null,
}

export const PLAN_PRICES_NGN: Record<UserPlan, number> = {
  FREE: 0,
  STARTER: 0,
  GROWTH: 15_000,
  PRO: 35_000,
}

export const PLAN_LABELS: Record<UserPlan, string> = {
  FREE: 'Starter',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PRO: 'Pro',
}

export const STARTER_REVIEW_LINK_LIMIT = 5
export const STARTER_PUBLIC_REVIEW_LIMIT = 5

/**
 * @deprecated WhatsApp logging is Growth+ only. Kept for older callers.
 */
export const FREE_WHATSAPP_MONTHLY_BOOKINGS = 0
export const FREE_WHATSAPP_MONTHLY_EXPENSES = 0

export interface PlanDefinition {
  id: Exclude<UserPlan, 'FREE'>
  name: string
  subtitle: string
  priceNgn: number
  propertyLimit: number
  features: readonly string[]
  recommended?: boolean
}

export const PLAN_CATALOG: readonly PlanDefinition[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    subtitle: 'Start organizing your shortlet',
    priceNgn: 0,
    propertyLimit: 1,
    features: [
      '1 property',
      '5 bookings per month',
      '5 expenses per month',
      '5 guest review requests per month',
      'Manual booking & expense tracking',
      'Calendar view',
      'Basic income summary',
      'Public review page',
    ],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    subtitle: 'Run your shortlet properly',
    priceNgn: 15_000,
    propertyLimit: 3,
    recommended: true,
    features: [
      'Up to 3 properties',
      'Unlimited bookings & expenses',
      'WhatsApp booking & expense logging',
      'Automatic guest review requests',
      'Monthly income & expense reports',
      'Property performance comparison',
      'Export records',
      'Everything in Starter',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    subtitle: 'Manage multiple properties and a team',
    priceNgn: 35_000,
    propertyLimit: 7,
    features: [
      'Up to 7 properties',
      'Unlimited bookings & expenses',
      'Co-host / team access',
      'Role-based access',
      'Portfolio dashboard',
      'Advanced reports',
      'Review moderation',
      'Custom branded public page',
      'Priority support',
      'Everything in Growth',
    ],
  },
] as const

/** @deprecated Use PLAN_PRICES_NGN.PRO */
export const PRO_PLAN_PRICE_NGN = PLAN_PRICES_NGN.PRO

export function normalizeUserPlan(plan: string): UserPlan {
  if (plan === 'PAID') return 'PRO'
  if (plan === 'FREE') return 'STARTER'
  if (USER_PLANS.includes(plan as UserPlan)) return plan as UserPlan
  return 'STARTER'
}

export function isPaidPlan(plan: UserPlan | string): plan is PaidPlan {
  const normalized = normalizeUserPlan(plan)
  return normalized === 'GROWTH' || normalized === 'PRO'
}

export function isFreePlan(plan: UserPlan | string): boolean {
  return normalizeUserPlan(plan) === 'STARTER'
}

export function comparePlans(a: UserPlan | string, b: UserPlan | string): number {
  return PLAN_RANK[normalizeUserPlan(a)] - PLAN_RANK[normalizeUserPlan(b)]
}

export function getPropertyLimit(plan: UserPlan | string): number {
  return PLAN_PROPERTY_LIMITS[normalizeUserPlan(plan)]
}

/** Null means unlimited. */
export function getBookingLimit(plan: UserPlan | string): number | null {
  return PLAN_BOOKING_LIMITS[normalizeUserPlan(plan)]
}

/** Null means unlimited. */
export function getExpenseLimit(plan: UserPlan | string): number | null {
  return PLAN_EXPENSE_LIMITS[normalizeUserPlan(plan)]
}

export function hasMonthAvailabilityCheck(plan?: UserPlan | string): boolean {
  // Available via WhatsApp on Growth+; in-app calendar remains available to all.
  if (plan == null) return true
  return true
}

export function getReviewLinkLimit(plan: UserPlan | string): number | null {
  if (hasUnlimitedReviewLinks(plan)) return null
  return STARTER_REVIEW_LINK_LIMIT
}

export function hasUnlimitedReviewLinks(plan: UserPlan | string): boolean {
  return comparePlans(plan, 'GROWTH') >= 0
}

export function hasAutoPublishReviews(_plan?: UserPlan | string): boolean {
  return true
}

/** @deprecated Use hasAutoPublishReviews — Growth+ publishes on submit; no manual approval */
export function hasReviewApproval(plan: UserPlan | string): boolean {
  return hasAutoPublishReviews(plan)
}

export function canHideReviews(plan: UserPlan | string): boolean {
  return normalizeUserPlan(plan) === 'PRO'
}

export function hasShareablePublicReviewPages(_plan?: UserPlan | string): boolean {
  return true
}

export function hasCoHostReviewApproval(plan: UserPlan | string): boolean {
  return normalizeUserPlan(plan) === 'PRO'
}

export function hasPortfolioDashboard(plan: UserPlan | string): boolean {
  return normalizeUserPlan(plan) === 'PRO'
}

/** WhatsApp logging & bot reports are available on Growth and above. */
export function hasWhatsAppAutomation(plan?: UserPlan | string): boolean {
  if (plan == null) return false
  return comparePlans(plan, 'GROWTH') >= 0
}

export function hasCalendarSync(plan: UserPlan | string): boolean {
  return comparePlans(plan, 'GROWTH') >= 0
}

export function hasCoHostAccess(plan: UserPlan | string): boolean {
  return normalizeUserPlan(plan) === 'PRO'
}

export function hasMonthlyReports(plan: UserPlan | string): boolean {
  return comparePlans(plan, 'GROWTH') >= 0
}

/** @deprecated Use hasPortfolioDashboard */
export function hasAdvancedReports(plan: UserPlan | string): boolean {
  return hasPortfolioDashboard(plan)
}

export function hasExportRecords(plan: UserPlan | string): boolean {
  return comparePlans(plan, 'GROWTH') >= 0
}

export function hasProfitSummary(plan: UserPlan | string): boolean {
  return comparePlans(plan, 'STARTER') >= 0
}

export function hasPropertyComparison(plan: UserPlan | string): boolean {
  return comparePlans(plan, 'GROWTH') >= 0
}

export function getPlanPriceNgn(plan: PaidPlan): number {
  return PLAN_PRICES_NGN[plan]
}

export function getPlanDefinition(plan: UserPlan): PlanDefinition {
  const normalized = normalizeUserPlan(plan)
  const match = PLAN_CATALOG.find((entry) => entry.id === normalized)
  if (!match) {
    throw new Error(`Unknown plan: ${plan}`)
  }
  return match
}
