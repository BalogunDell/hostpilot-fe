/** Legacy FREE rows are normalized to STARTER (the free tier). */
export type UserPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO'

export type PaidPlan = 'GROWTH' | 'PRO'

/** Prepaid one-time billing periods (not Paystack recurring subscriptions). */
export type BillingInterval = 'monthly' | 'biannual' | 'annual'

export const USER_PLANS = ['FREE', 'STARTER', 'GROWTH', 'PRO'] as const satisfies readonly UserPlan[]

export const PAID_PLANS = ['GROWTH', 'PRO'] as const satisfies readonly PaidPlan[]

export const BILLING_INTERVALS = [
  'monthly',
  'biannual',
  'annual',
] as const satisfies readonly BillingInterval[]

export const BILLING_INTERVAL_MONTHS: Record<BillingInterval, number> = {
  monthly: 1,
  biannual: 6,
  annual: 12,
}

/** Discount off full prepaid total (monthly × months). */
export const BILLING_INTERVAL_DISCOUNT: Record<BillingInterval, number> = {
  monthly: 0,
  biannual: 0.005,
  annual: 0.015,
}

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  monthly: 'Monthly',
  biannual: 'Every 6 months',
  annual: 'Yearly',
}

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

/**
 * How many past months (from the current month) a plan can add/update
 * bookings and expenses for. Current and future dates are always allowed.
 * Starter: 1, Growth: 3, Pro: 12 (up to a year).
 */
export const PLAN_HISTORY_LOOKBACK_MONTHS: Record<UserPlan, number> = {
  FREE: 1,
  STARTER: 1,
  GROWTH: 3,
  PRO: 12,
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
  GROWTH: 20_000,
  PRO: 40_000,
}

export const PLAN_LABELS: Record<UserPlan, string> = {
  FREE: 'Starter',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PRO: 'Pro',
}

export const STARTER_REVIEW_LINK_LIMIT = 5
export const STARTER_PUBLIC_REVIEW_LIMIT = 5

/** Starter plan: one successful WhatsApp action (any kind) per calendar month. */
export const FREE_WHATSAPP_MONTHLY_QUERIES = 1

/**
 * @deprecated Prefer FREE_WHATSAPP_MONTHLY_QUERIES — kept for older callers.
 */
export const FREE_WHATSAPP_MONTHLY_BOOKINGS = FREE_WHATSAPP_MONTHLY_QUERIES
export const FREE_WHATSAPP_MONTHLY_EXPENSES = FREE_WHATSAPP_MONTHLY_QUERIES

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
      'Add or update records up to 1 month back',
      '5 guest review requests per month',
      '1 WhatsApp booking or expense log per month',
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
    priceNgn: 20_000,
    propertyLimit: 3,
    recommended: true,
    features: [
      'Up to 3 properties',
      'Unlimited bookings & expenses',
      'Add or update records up to 3 months back',
      'Unlimited WhatsApp booking & expense logging',
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
    priceNgn: 40_000,
    propertyLimit: 7,
    features: [
      'Up to 7 properties',
      'Unlimited bookings & expenses',
      'Add or update records up to a year back',
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

/** Past months a plan can add or update bookings/expenses for. */
export function getHistoryLookbackMonths(plan: UserPlan | string): number {
  return PLAN_HISTORY_LOOKBACK_MONTHS[normalizeUserPlan(plan)]
}

/** Month-selector options including the current month. */
export function getHistoryMonthOptionCount(plan: UserPlan | string): number {
  return getHistoryLookbackMonths(plan) + 1
}

function padMonth(monthIndex: number): string {
  return String(monthIndex).padStart(2, '0')
}

export function toYearMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${padMonth(date.getMonth() + 1)}`
}

/** Earliest yyyy-MM the plan may edit (current month minus lookback). */
export function earliestHistoryMonth(plan: UserPlan | string, now: Date = new Date()): string {
  const lookback = getHistoryLookbackMonths(plan)
  const date = new Date(now.getFullYear(), now.getMonth() - lookback, 1)
  return toYearMonth(date)
}

/**
 * Past months must fall within the plan lookback window.
 * Current and future year-months are always allowed (upcoming bookings).
 */
export function isYearMonthWithinHistoryLookback(
  plan: UserPlan | string,
  yearMonth: string,
  now: Date = new Date(),
): boolean {
  const current = toYearMonth(now)
  if (yearMonth > current) return true
  return yearMonth >= earliestHistoryMonth(plan, now)
}

export function isDateWithinHistoryLookback(
  plan: UserPlan | string,
  dateOnly: string,
  now: Date = new Date(),
): boolean {
  return isYearMonthWithinHistoryLookback(plan, dateOnly.slice(0, 7), now)
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

/** WhatsApp bot is available on all plans; Starter is limited to 1 query/month. */
export function hasWhatsAppAutomation(_plan?: UserPlan | string): boolean {
  return true
}

export function getWhatsAppMonthlyQueryLimit(plan?: UserPlan | string): number | null {
  if (plan == null) return FREE_WHATSAPP_MONTHLY_QUERIES
  return isFreePlan(plan) ? FREE_WHATSAPP_MONTHLY_QUERIES : null
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

/** Discount percent shown in UI (e.g. annual → 1.5). */
export function getBillingSavingsPercent(interval: BillingInterval): number {
  return BILLING_INTERVAL_DISCOUNT[interval] * 100
}

/** Full prepaid total before discount (monthly × months). */
export function getPlanFullPrepaidPriceNgn(plan: PaidPlan, interval: BillingInterval): number {
  return PLAN_PRICES_NGN[plan] * BILLING_INTERVAL_MONTHS[interval]
}

/**
 * One-time checkout total in NGN for a prepaid interval.
 * Annual: monthly × 12 − 1.5%. Bi-annual: monthly × 6 − 0.5%.
 */
export function getPlanCheckoutPriceNgn(plan: PaidPlan, interval: BillingInterval): number {
  const full = getPlanFullPrepaidPriceNgn(plan, interval)
  const discount = BILLING_INTERVAL_DISCOUNT[interval]
  return Math.round(full * (1 - discount))
}

export function getPlanDefinition(plan: UserPlan): PlanDefinition {
  const normalized = normalizeUserPlan(plan)
  const match = PLAN_CATALOG.find((entry) => entry.id === normalized)
  if (!match) {
    throw new Error(`Unknown plan: ${plan}`)
  }
  return match
}
