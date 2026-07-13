import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'

export function useApi() {
  const { token } = useAuth()

  return useCallback(
    <T,>(path: string, options: Omit<RequestInit, 'headers'> & { token?: string | null } = {}) =>
      apiRequest<T>(path, { ...options, token: options.token ?? token }),
    [token],
  )
}
