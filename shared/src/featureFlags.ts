export interface FeatureFlags {
  /** Smart pricing optimization tip on the Properties page */
  smartPricing: boolean
  /** Guest booking Paystack splits, host payouts, and /pay links */
  bookingPayments: boolean
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  smartPricing: false,
  bookingPayments: false,
}
