import {
  getPropertyLimit,
  getReviewLinkLimit,
  hasAutoPublishReviews,
  hasCoHostAccess,
  hasExportRecords,
  hasMonthlyReports,
  hasPortfolioDashboard,
  hasProfitSummary,
  hasPropertyComparison,
  hasShareablePublicReviewPages,
  hasUnlimitedReviewLinks,
  hasWhatsAppAutomation,
  hasCalendarSync,
  canHideReviews,
  normalizeUserPlan,
  PLAN_LABELS,
  type UserPlan,
} from '@staypilot/shared'
import { useAuth } from '../context/AuthContext'

export function usePlanFeatures() {
  const { user } = useAuth()
  const plan = normalizeUserPlan(user?.plan ?? 'STARTER')

  return {
    plan,
    planLabel: PLAN_LABELS[plan],
    propertyLimit: getPropertyLimit(plan),
    reviewLinkLimit: getReviewLinkLimit(plan),
    hasUnlimitedReviewLinks: hasUnlimitedReviewLinks(plan),
    hasAutoPublishReviews: hasAutoPublishReviews(plan),
    canHideReviews: canHideReviews(plan),
    hasShareablePublicReviewPages: hasShareablePublicReviewPages(plan),
    hasPortfolioDashboard: hasPortfolioDashboard(plan),
    hasWhatsApp: hasWhatsAppAutomation(plan),
    hasCalendarSync: hasCalendarSync(plan),
    hasCoHosts: hasCoHostAccess(plan),
    hasMonthlyReports: hasMonthlyReports(plan),
    hasExportRecords: hasExportRecords(plan),
    hasProfitSummary: hasProfitSummary(plan),
    hasPropertyComparison: hasPropertyComparison(plan),
  }
}

export function minimumPlanLabel(requiredPlan: UserPlan): string {
  return PLAN_LABELS[normalizeUserPlan(requiredPlan)]
}
