import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getHistoryMonthOptionCount, normalizeUserPlan } from '@staypilot/shared'
import { useAuth } from './AuthContext'
import {
  buildMonthOptions,
  currentMonthValue,
  monthToDateRange,
} from '../lib/monthPeriod'

const STORAGE_KEY = 'hostsledger_selected_month'

function readStoredMonth(): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored && /^\d{4}-\d{2}$/.test(stored)) return stored
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
  return currentMonthValue()
}

interface DashboardPeriodContextValue {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  monthOptions: Array<{ value: string; label: string }>
  from: string
  to: string
  start: Date
  end: Date
  label: string
  historyLookbackMonths: number
}

const DashboardPeriodContext = createContext<DashboardPeriodContextValue | null>(null)

export function DashboardPeriodProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const plan = normalizeUserPlan(user?.plan ?? 'STARTER')
  const optionCount = getHistoryMonthOptionCount(plan)
  const [selectedMonth, setSelectedMonthState] = useState(readStoredMonth)

  const monthOptions = useMemo(() => buildMonthOptions(optionCount), [optionCount])
  const range = useMemo(() => monthToDateRange(selectedMonth), [selectedMonth])

  const setSelectedMonth = useCallback((month: string) => {
    setSelectedMonthState(month)
    try {
      sessionStorage.setItem(STORAGE_KEY, month)
    } catch {
      // Ignore storage failures
    }
  }, [])

  useEffect(() => {
    const allowed = new Set(monthOptions.map((option) => option.value))
    if (!allowed.has(selectedMonth)) {
      setSelectedMonth(currentMonthValue())
    }
  }, [monthOptions, selectedMonth, setSelectedMonth])

  const value = useMemo(
    () => ({
      selectedMonth,
      setSelectedMonth,
      monthOptions,
      historyLookbackMonths: optionCount - 1,
      ...range,
    }),
    [selectedMonth, setSelectedMonth, monthOptions, optionCount, range],
  )

  return (
    <DashboardPeriodContext.Provider value={value}>{children}</DashboardPeriodContext.Provider>
  )
}

export function useDashboardPeriod() {
  const context = useContext(DashboardPeriodContext)
  if (!context) {
    throw new Error('useDashboardPeriod must be used within DashboardPeriodProvider')
  }
  return context
}
