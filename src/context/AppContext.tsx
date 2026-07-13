import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface AppContextValue {
  /** Former paid user downgraded to Free — data is view-only. */
  readOnly: boolean
  /** When true, mutation actions (buttons) should be disabled app-wide. */
  actionsDisabled: boolean
  canWrite: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const readOnly = user?.readOnly ?? false

  const value = useMemo(
    () => ({
      readOnly,
      actionsDisabled: readOnly,
      canWrite: !readOnly,
    }),
    [readOnly],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

/** Shorthand for `useApp().actionsDisabled`. */
export function useActionsDisabled() {
  return useApp().actionsDisabled
}
