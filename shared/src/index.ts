import { normalizeUserPlan } from './plans.js'

export type UserPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO'

export {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
} from './featureFlags.js'

export {
  comparePlans,
  getBookingLimit,
  getExpenseLimit,
  getPlanDefinition,
  getPlanPriceNgn,
  getPropertyLimit,
  getReviewLinkLimit,
  hasAdvancedReports,
  hasCalendarSync,
  hasCoHostAccess,
  hasCoHostReviewApproval,
  hasExportRecords,
  hasMonthAvailabilityCheck,
  hasMonthlyReports,
  hasPortfolioDashboard,
  hasProfitSummary,
  hasPropertyComparison,
  hasAutoPublishReviews,
  hasReviewApproval,
  canHideReviews,
  hasShareablePublicReviewPages,
  hasUnlimitedReviewLinks,
  hasWhatsAppAutomation,
  isFreePlan,
  isPaidPlan,
  normalizeUserPlan,
  PAID_PLANS,
  PLAN_BOOKING_LIMITS,
  PLAN_CATALOG,
  PLAN_EXPENSE_LIMITS,
  PLAN_LABELS,
  PLAN_PRICES_NGN,
  PLAN_PROPERTY_LIMITS,
  PLAN_RANK,
  PRO_PLAN_PRICE_NGN,
  STARTER_PUBLIC_REVIEW_LIMIT,
  STARTER_REVIEW_LINK_LIMIT,
  USER_PLANS,
  type PaidPlan,
  type PlanDefinition,
} from './plans.js'

/** True when a former paid user was downgraded to Starter and cannot mutate data. */
export function isReadOnlyAccount(
  plan: UserPlan | string,
  subscriptionExpiredAt: Date | string | null | undefined,
): boolean {
  return normalizeUserPlan(plan) === 'STARTER' && subscriptionExpiredAt != null
}

export const COHOST_PRIVILEGES = [
  'VIEW_DASHBOARD',
  'MANAGE_BOOKINGS',
  'MANAGE_EXPENSES',
  'MANAGE_PROPERTIES',
  'MANAGE_CALENDAR_SYNC',
  'MANAGE_LISTING',
  'MANAGE_COHOSTS',
] as const

export type CoHostPrivilege = (typeof COHOST_PRIVILEGES)[number]

export const COHOST_PRIVILEGE_LABELS: Record<CoHostPrivilege, string> = {
  VIEW_DASHBOARD: 'View dashboard',
  MANAGE_BOOKINGS: 'Manage bookings',
  MANAGE_EXPENSES: 'Manage expenses',
  MANAGE_PROPERTIES: 'Manage properties',
  MANAGE_CALENDAR_SYNC: 'Manage calendar sync',
  MANAGE_LISTING: 'Manage listing',
  MANAGE_COHOSTS: 'Manage co-hosts',
}

export function hasAllCoHostPrivileges(privileges: readonly string[]): boolean {
  return COHOST_PRIVILEGES.every((privilege) => privileges.includes(privilege))
}

export function formatCoHostPrivileges(privileges: readonly string[]): string {
  if (hasAllCoHostPrivileges(privileges)) return 'All access'
  return privileges
    .map((privilege) => COHOST_PRIVILEGE_LABELS[privilege as CoHostPrivilege] ?? privilege)
    .join(', ')
}

export const FREE_PROPERTY_LIMIT = 1
export const FREE_COHOST_LIMIT = 0
export const FREE_REPORT_DOWNLOAD_LIMIT = 0

export const CALENDAR_SYNC_PLATFORMS = ['AIRBNB', 'BOOKING'] as const
export type CalendarSyncPlatform = (typeof CALENDAR_SYNC_PLATFORMS)[number]

export const CALENDAR_SYNC_PLATFORM_LABELS: Record<CalendarSyncPlatform, string> = {
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking.com',
}

export const CALENDAR_SYNC_PLATFORM_HELP_URLS: Record<CalendarSyncPlatform, string> = {
  AIRBNB: 'https://www.airbnb.com/help/article/99#section-heading-1',
  BOOKING:
    'https://partner.booking.com/en-gb/help/rates-availability/extranet-calendar/how-synchronise-your-calendars-across-channels#panel-26970',
}

export const CALENDAR_SYNC_PLATFORM_HELP_TEXT: Record<CalendarSyncPlatform, string> = {
  AIRBNB:
    'In your hosting dashboard, open Calendar → Availability → Connect calendars, then copy your export link.',
  BOOKING:
    'In the extranet, go to Rates & Availability → Sync calendars → Add calendar connection → Skip to export → Copy link.',
}

export function calendarSyncSourceLabel(platform: CalendarSyncPlatform): string {
  return platform === 'AIRBNB' ? 'Airbnb' : 'Bookings.com'
}
