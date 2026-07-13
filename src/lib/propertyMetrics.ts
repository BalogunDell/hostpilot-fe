import { formatNaira } from '../api/client'

export function propertyStatus(occupancy: number, revenue: number) {
  if (revenue === 0 && occupancy === 0) return 'maintenance' as const
  if (occupancy >= 50) return 'occupied' as const
  return 'active' as const
}

export function formatNairaCompact(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k`
  return formatNaira(amount)
}

export function listingHealthScore(input: {
  imageCount: number
  hasDescription: boolean
  hasNightlyRate: boolean
  revenue: number
  occupancyRate: number
}) {
  let score = 0
  if (input.imageCount > 0) score += 25
  if (input.hasDescription) score += 20
  if (input.hasNightlyRate) score += 15
  if (input.revenue > 0) score += 20
  if (input.occupancyRate >= 40) score += 20
  return Math.min(score, 100)
}

export function listingHealthLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Fair'
  if (score >= 40) return 'Needs work'
  return 'Poor'
}

export function listingHealthMessage(score: number) {
  if (score >= 80) {
    return 'Your listing visibility is strong. Keep response times high to maintain momentum.'
  }
  if (score >= 65) {
    return `Your listing visibility is at ${score}%. Add professional photos to improve.`
  }
  if (score >= 40) {
    return 'Your listing needs more detail. Add photos, pricing, and a compelling description.'
  }
  return 'Your listing is under-optimized. Complete your profile to attract more bookings.'
}

export const EXPENSE_CATEGORIES = [
  'Cleaning Services',
  'Internet',
  'Power Supply',
  'Toiletries',
  'Staff',
  'Maintenance',
  'Other',
] as const
