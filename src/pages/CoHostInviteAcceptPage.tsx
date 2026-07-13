import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Typography } from '../components'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

export function CoHostInviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const { token: authToken, sessionReady, refreshUser } = useAuth()
  const api = useApi()
  const navigate = useNavigate()
  const attemptedRef = useRef(false)

  const acceptMutation = useMutation({
    mutationFn: () =>
      api(`/cohosts/accept/${token}`, {
        method: 'POST',
      }),
    onSuccess: async () => {
      await refreshUser()
      navigate('/', { replace: true })
    },
  })

  useEffect(() => {
    if (sessionReady && authToken && token && !attemptedRef.current) {
      attemptedRef.current = true
      acceptMutation.mutate()
    }
  }, [acceptMutation, authToken, sessionReady, token])

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Typography variant="body">Loading invitation…</Typography>
      </div>
    )
  }

  if (!authToken) {
    const redirect = encodeURIComponent(`/cohost-invite/${token}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  const errorMessage =
    acceptMutation.error instanceof ApiError
      ? acceptMutation.error.message
      : acceptMutation.error instanceof Error
        ? acceptMutation.error.message
        : null

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Typography variant="h2" className="mb-2">Co-host invitation</Typography>
        {acceptMutation.isPending ? (
          <Typography variant="body">Accepting your invitation…</Typography>
        ) : acceptMutation.isSuccess ? (
          <Typography variant="body">Invitation accepted. Redirecting to your dashboard…</Typography>
        ) : (
          <>
            <Typography variant="body" className="mb-4">
              {errorMessage ?? 'We could not accept this invitation.'}
            </Typography>
            <div className="flex gap-3">
              <Button onClick={() => acceptMutation.mutate()} loading={acceptMutation.isPending}>
                Try again
              </Button>
              <Link to="/">
                <Button variant="outlined">Go to dashboard</Button>
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
