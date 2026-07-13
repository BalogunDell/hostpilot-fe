export interface FeatureFlags {
  /** Smart pricing optimization tip on the Properties page */
  smartPricing: boolean
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  smartPricing: false,
}
