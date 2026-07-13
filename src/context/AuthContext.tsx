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
  createdAt: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  featureFlags: FeatureFlags
  sessionReady: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
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

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setFeatureFlags(DEFAULT_FEATURE_FLAGS)
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
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const storedToken = readStoredToken()
      if (!storedToken) {
        setSessionReady(true)
        return
      }

      try {
        const data = await apiRequest<{ user: User; featureFlags: FeatureFlags }>('/auth/me', {
          token: storedToken,
          logoutOn401: false,
        })
        if (cancelled) return
        setToken(storedToken)
        setUser(data.user)
        setFeatureFlags(data.featureFlags)
      } catch (error) {
        if (cancelled) return
        // Only clear the session when the token is actually invalid
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setSessionReady(true)
      }
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

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
    setSessionReady(true)
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
      setSessionReady(true)
    },
    [],
  )

  const value = useMemo(
    () => ({ user, token, featureFlags, sessionReady, login, register, logout, refreshUser }),
    [user, token, featureFlags, sessionReady, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
