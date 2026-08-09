import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, apiRequest, setOnUnauthorized } from '../api/client'
import {
  DEFAULT_FEATURE_FLAGS,
  type BillingInterval,
  type FeatureFlags,
  type UserPlan,
} from '@staypilot/shared'

export interface User {
  id: string
  email: string
  name: string
  plan: UserPlan
  readOnly: boolean
  role: 'ADMIN' | 'COHOST'
  emailVerified: boolean
  /** Platform staff (support@…) — not the property-owner ADMIN role. */
  isPlatformAdmin?: boolean
  createdAt: string
  billingInterval?: BillingInterval | null
  subscriptionEndsAt?: string | null
}

interface AuthContextValue {
  user: User | null
  token: string | null
  featureFlags: FeatureFlags
  sessionReady: boolean
  restoreError: string | null
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  restoreSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'staypilot_token'

function readStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [user, setUser] = useState<User | null>(null)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS)
  const [sessionReady, setSessionReady] = useState(() => !readStoredToken())
  const [restoreError, setRestoreError] = useState<string | null>(null)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setFeatureFlags(DEFAULT_FEATURE_FLAGS)
    setRestoreError(null)
    setSessionReady(true)
  }, [])

  const refreshUser = useCallback(async () => {
    const activeToken = readStoredToken()
    if (!activeToken) {
      setUser(null)
      setToken(null)
      return
    }
    const data = await apiRequest<{ user: User; featureFlags: FeatureFlags }>('/auth/me', {
      token: activeToken,
      logoutOn401: false,
    })
    setToken(activeToken)
    setUser(data.user)
    setFeatureFlags(data.featureFlags)
    setRestoreError(null)
  }, [])

  const restoreSession = useCallback(async () => {
    const storedToken = readStoredToken()
    if (!storedToken) {
      setToken(null)
      setUser(null)
      setRestoreError(null)
      setSessionReady(true)
      return
    }

    setSessionReady(false)
    setRestoreError(null)
    try {
      const data = await apiRequest<{ user: User; featureFlags: FeatureFlags }>('/auth/me', {
        token: storedToken,
        logoutOn401: false,
      })
      setToken(storedToken)
      setUser(data.user)
      setFeatureFlags(data.featureFlags)
      setRestoreError(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
        setFeatureFlags(DEFAULT_FEATURE_FLAGS)
        setRestoreError(null)
      } else {
        // Keep the token; AuthBootstrap will show retry instead of an empty shell.
        setToken(storedToken)
        setUser(null)
        setRestoreError(
          error instanceof Error
            ? error.message
            : 'Could not restore your session. Check your connection and try again.',
        )
      }
    } finally {
      setSessionReady(true)
    }
  }, [])

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  useEffect(() => {
    setOnUnauthorized(() => {
      if (sessionReady) logout()
    })
    return () => setOnUnauthorized(null)
  }, [logout, sessionReady])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ user: User; token: string; featureFlags: FeatureFlags }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    )
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    setFeatureFlags(data.featureFlags)
    setRestoreError(null)
    setSessionReady(true)
    return data.user
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiRequest<{ user: User; token: string; featureFlags: FeatureFlags }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        },
      )
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      setFeatureFlags(data.featureFlags)
      setRestoreError(null)
      setSessionReady(true)
    },
    [],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      featureFlags,
      sessionReady,
      restoreError,
      login,
      register,
      logout,
      refreshUser,
      restoreSession,
    }),
    [
      user,
      token,
      featureFlags,
      sessionReady,
      restoreError,
      login,
      register,
      logout,
      refreshUser,
      restoreSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
