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
  PRO: 10,
}

/** Null = unlimited. Counted per calendar month. */
export const PLAN_BOOKING_LIMITS: Record<UserPlan, number | null> = {
  FREE: 2,
  STARTER: 2,
  GROWTH: 10,
  PRO: null,
}

/** Null = unlimited. Counted per calendar month. */
export const PLAN_EXPENSE_LIMITS: Record<UserPlan, number | null> = {
  FREE: 1,
  STARTER: 1,
  GROWTH: 5,
  PRO: null,
}

export const PLAN_PRICES_NGN: Record<UserPlan, number> = {
  FREE: 0,
  STARTER: 0,
  GROWTH: 12_000,
  PRO: 25_000,
}

export const PLAN_LABELS: Record<UserPlan, string> = {
  FREE: 'Starter',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PRO: 'Pro',
}

export const STARTER_REVIEW_LINK_LIMIT = 3
export const STARTER_PUBLIC_REVIEW_LIMIT = 3

/**
 * Free (Starter) plan gets a monthly taster of WhatsApp logging, tracked
 * separately from the manual booking/expense quotas. Paid plans log via
 * WhatsApp against their normal monthly quotas.
 */
export const FREE_WHATSAPP_MONTHLY_BOOKINGS = 1
export const FREE_WHATSAPP_MONTHLY_EXPENSES = 1

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
    subtitle: 'Free',
    priceNgn: 0,
    propertyLimit: 1,
    features: [
      '1 property',
      'Up to 2 bookings per month',
      'Up to 1 expense per month',
      'Log 1 booking & 1 expense per month by WhatsApp',
      'Check available dates for a month',
      'Manual booking & expense tracking',
      'Calendar view',
      'Basic income summary',
      'Create up to 3 guest review links',
      'Reviews published instantly (up to 3 on public page)',
    ],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    subtitle: 'Paid',
    priceNgn: 12_000,
    propertyLimit: 3,
    recommended: true,
    features: [
      'Up to 3 properties',
      'Up to 10 bookings per month',
      'Up to 5 expenses per month',
      'Log every booking & expense by WhatsApp',
      'Check available dates for a month',
      'Everything in Starter',
      'Unlimited guest review links',
      'Shareable public review pages',
      'Reviews published instantly on submit',
      'Monthly reports',
      'Property performance comparison',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    subtitle: 'Paid',
    priceNgn: 25_000,
    propertyLimit: 10,
    features: [
      'Up to 10 properties',
      'Unlimited bookings & expenses',
      'Check available dates for a month',
      'Everything in Growth',
      'Co-host access',
      'Hide reviews from your public page',
      'Portfolio dashboard',
      'Priority support',
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

export function hasMonthAvailabilityCheck(_plan?: UserPlan | string): boolean {
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

export function hasShareablePublicReviewPages(plan: UserPlan | string): boolean {
  return comparePlans(plan, 'GROWTH') >= 0
}

export function hasCoHostReviewApproval(plan: UserPlan | string): boolean {
  return normalizeUserPlan(plan) === 'PRO'
}

export function hasPortfolioDashboard(plan: UserPlan | string): boolean {
  return normalizeUserPlan(plan) === 'PRO'
}

/**
 * WhatsApp logging is available on every plan. Free users get a small monthly
 * allowance (see FREE_WHATSAPP_MONTHLY_BOOKINGS / _EXPENSES); paid plans log
 * against their normal monthly quotas.
 */
export function hasWhatsAppAutomation(_plan?: UserPlan | string): boolean {
  return true
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
