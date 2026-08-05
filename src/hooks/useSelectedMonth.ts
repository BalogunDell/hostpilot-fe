import { useDashboardPeriod } from '../context/DashboardPeriodContext'

export {
  buildMonthOptions,
  currentMonthValue,
  monthToDateRange,
} from '../lib/monthPeriod'

/** Reads the dashboard-wide selected month from context. */
export function useSelectedMonth() {
  return useDashboardPeriod()
}
