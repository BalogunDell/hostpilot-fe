import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  PasswordInput,
  Typography,
  WhatsAppBusinessInfoBanner,
} from '../../components'
import { ApiStatusBanner } from '../../components/ApiStatusBanner'
import { ApiError, apiRequest } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { usePlanFeatures } from '../../hooks/usePlanFeatures'
import {
  WHATSAPP_BUSINESS_PHONE_LABEL,
} from '../../lib/whatsappCopy'
import { SITE_URL } from '../../lib/urls'

/** HostsLedger brand lockup shown on unauthenticated pages. */
function AuthBrand() {
  return (
    <a
      href={SITE_URL}
      aria-label="HostsLedger home"
      className="mb-6 flex items-center justify-center gap-2.5"
    >
      <span className="grid size-9 place-items-center rounded-[9px] bg-primary-900 text-tertiary">
        <BarChart3 className="size-5" aria-hidden />
      </span>
      <span className="text-[17px] font-bold tracking-tight text-foreground">HostsLedger</span>
    </a>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid email or password')
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ApiStatusBanner />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <AuthBrand />
          <Typography variant="h2" className="mb-2">Welcome back</Typography>
          <Typography variant="caption" className="mb-6 block">
            Sign in to manage your properties
          </Typography>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Link to="/forgot-password" className="self-end text-xs font-medium text-secondary hover:underline">
                Forgot password?
              </Link>
            </div>
            {error ? <Typography variant="caption" className="text-destructive">{error}</Typography> : null}
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <Typography variant="caption" className="mt-4 block text-center">
            No account?{' '}
            <Link
              to={
                redirectTo
                  ? `/register?redirect=${encodeURIComponent(redirectTo)}`
                  : '/register'
              }
              className="text-secondary"
            >
              Register
            </Link>
          </Typography>
        </Card>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    try {
      await register(name, email, password)
      navigate(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/onboarding')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ApiStatusBanner />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <AuthBrand />
          <Typography variant="h2" className="mb-2">Create account</Typography>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordInput
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />
            {error ? <Typography variant="caption" className="text-destructive">{error}</Typography> : null}
            <Button type="submit" className="w-full">Register</Button>
          </form>
          <Typography variant="caption" className="mt-4 block text-center">
            Have an account? <Link to="/login" className="text-secondary">Sign in</Link>
          </Typography>
        </Card>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const api = useApi()
  const navigate = useNavigate()
  const { hasWhatsApp } = usePlanFeatures()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [whatsappStep, setWhatsappStep] = useState<'phone' | 'code'>('phone')
  const [propertyName, setPropertyName] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendCode() {
    if (!phone.trim()) {
      setError('Enter your WhatsApp Business phone number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await api<{
        phoneNumber: string
        connected: boolean
        verificationSent?: boolean
      }>('/whatsapp/link/request', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phone }),
      })
      if (result.connected) {
        setPendingPhone(result.phoneNumber)
        setWhatsappStep('phone')
        return
      }
      setPendingPhone(result.phoneNumber)
      setWhatsappStep('code')
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (hasWhatsApp && pendingPhone && whatsappStep === 'code') {
        if (code.trim().length !== 6) {
          setError('Enter the 6-digit code from WhatsApp')
          setLoading(false)
          return
        }
        await api('/whatsapp/link/confirm', {
          method: 'POST',
          body: JSON.stringify({ phoneNumber: pendingPhone, code }),
        })
      }
      await api('/properties', {
        method: 'POST',
        body: JSON.stringify({ name: propertyName, location }),
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <AuthBrand />
        <Typography variant="h2" className="mb-2">Set up HostsLedger</Typography>
        <Typography variant="caption" className="mb-6 block">
          Add your first property and optionally connect a WhatsApp Business number.
        </Typography>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <WhatsAppBusinessInfoBanner />
          {whatsappStep === 'code' ? (
            <>
              <Typography variant="caption" className="text-muted-foreground">
                Enter the 6-digit code sent to {pendingPhone} on WhatsApp.
              </Typography>
              <Input
                label="Verification code"
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" loading={loading} onClick={handleSendCode}>
                  Resend code
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setWhatsappStep('phone')
                    setCode('')
                    setPendingPhone('')
                  }}
                >
                  Change number
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                label={`Optional: ${WHATSAPP_BUSINESS_PHONE_LABEL}`}
                placeholder="+234..."
                value={phone}
                disabled={!hasWhatsApp}
                onChange={(e) => setPhone(e.target.value)}
              />
              {hasWhatsApp ? (
                <Typography variant="caption" className="text-muted-foreground">
                  We’ll send a verification code to WhatsApp before connecting.
                </Typography>
              ) : (
                <Typography variant="caption" className="text-muted-foreground">
                  <a href="/settings#pricing" className="font-medium text-secondary hover:underline">
                    Upgrade to Growth
                  </a>{' '}
                  to enable WhatsApp booking entry.
                </Typography>
              )}
              {hasWhatsApp && phone.trim() ? (
                <Button type="button" variant="secondary" loading={loading} onClick={handleSendCode}>
                  Send WhatsApp verification code
                </Button>
              ) : null}
            </>
          )}
          <Input label="Property name" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
          <Input
            label="Location"
            placeholder="e.g. Lekki, Lagos"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {error ? <Typography variant="caption" className="text-destructive">{error}</Typography> : null}
          <Button type="submit" loading={loading}>
            Complete setup
          </Button>
        </form>
      </Card>
    </div>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ApiStatusBanner />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <AuthBrand />
          {submitted ? (
            <>
              <Typography variant="h2" className="mb-2">Check your email</Typography>
              <Typography variant="caption" className="mb-6 block">
                If an account exists for{' '}
                <span className="font-medium text-foreground">{email}</span>, we've sent a link to
                reset your password. The link expires in 1 hour.
              </Typography>
              <Link to="/login">
                <Button variant="outlined" className="w-full">Back to sign in</Button>
              </Link>
            </>
          ) : (
            <>
              <Typography variant="h2" className="mb-2">Forgot password?</Typography>
              <Typography variant="caption" className="mb-6 block">
                Enter the email linked to your account and we'll send you a reset link.
              </Typography>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error ? <Typography variant="caption" className="text-destructive">{error}</Typography> : null}
                <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
              </form>
              <Typography variant="caption" className="mt-4 block text-center">
                Remembered it? <Link to="/login" className="text-secondary">Sign in</Link>
              </Typography>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'This reset link is invalid or has expired.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <Navigate to="/forgot-password" replace />
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ApiStatusBanner />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <AuthBrand />
          {done ? (
            <>
              <Typography variant="h2" className="mb-2">Password updated</Typography>
              <Typography variant="caption" className="mb-6 block">
                Your password has been changed. You can now sign in with your new password.
              </Typography>
              <Link to="/login">
                <Button className="w-full">Sign in</Button>
              </Link>
            </>
          ) : (
            <>
              <Typography variant="h2" className="mb-2">Set a new password</Typography>
              <Typography variant="caption" className="mb-6 block">
                Choose a new password for your account.
              </Typography>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <PasswordInput
                  label="New password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordInput
                  label="Confirm new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={
                    confirmPassword && password !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                />
                {error ? <Typography variant="caption" className="text-destructive">{error}</Typography> : null}
                <Button type="submit" className="w-full" loading={loading}>Reset password</Button>
              </form>
              <Typography variant="caption" className="mt-4 block text-center">
                <Link to="/login" className="text-secondary">Back to sign in</Link>
              </Typography>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const { token: authToken, refreshUser } = useAuth()
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [error, setError] = useState('')
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (!token || attemptedRef.current) return
    attemptedRef.current = true

    async function verify() {
      try {
        await apiRequest('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        })
        // Refresh the session so the verify banner clears for signed-in users.
        try {
          await refreshUser()
        } catch {
          // Ignore: verification succeeded regardless of session refresh.
        }
        setStatus('success')
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'This verification link is invalid or has expired.',
        )
        setStatus('error')
      }
    }

    void verify()
  }, [token, refreshUser])

  if (!token) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ApiStatusBanner />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <AuthBrand />
          {status === 'pending' ? (
            <Typography variant="body" className="text-muted-foreground">
              Verifying your email…
            </Typography>
          ) : status === 'success' ? (
            <>
              <Typography variant="h2" className="mb-2">Email verified</Typography>
              <Typography variant="caption" className="mb-6 block">
                Thanks for confirming your email address. Your account is all set.
              </Typography>
              <Link to={authToken ? '/' : '/login'}>
                <Button className="w-full">{authToken ? 'Go to dashboard' : 'Sign in'}</Button>
              </Link>
            </>
          ) : (
            <>
              <Typography variant="h2" className="mb-2">Verification failed</Typography>
              <Typography variant="caption" className="mb-6 block">
                {error}
              </Typography>
              <Link to={authToken ? '/' : '/login'}>
                <Button variant="outlined" className="w-full">
                  {authToken ? 'Back to dashboard' : 'Back to sign in'}
                </Button>
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

/** Full-screen blocker shown to logged-in users whose email is not yet verified. */
export function VerifyEmailGate() {
  const { user, logout, refreshUser } = useAuth()
  const api = useApi()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function handleResend() {
    setSending(true)
    setError('')
    setNotice('')
    try {
      await api('/auth/resend-verification', { method: 'POST' })
      setSent(true)
      setNotice('Verification email sent. Check your inbox.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send verification email.')
    } finally {
      setSending(false)
    }
  }

  async function handleRefresh() {
    setChecking(true)
    setError('')
    setNotice('')
    try {
      await refreshUser()
      setNotice("Still not verified. Click the link in your email, then try again.")
    } catch {
      setError('Could not check your status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ApiStatusBanner />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <AuthBrand />
          <Typography variant="h2" className="mb-2">Verify your email</Typography>
          <Typography variant="caption" className="mb-6 block">
            To keep your account secure, confirm your email before using HostsLedger. We sent a
            verification link to{' '}
            <span className="font-medium text-foreground">{user?.email}</span>. This page unlocks
            as soon as your email is verified.
          </Typography>
          {notice ? (
            <Typography variant="caption" className="mb-4 block text-secondary">{notice}</Typography>
          ) : null}
          {error ? (
            <Typography variant="caption" className="mb-4 block text-destructive">{error}</Typography>
          ) : null}
          <div className="flex flex-col gap-3">
            <Button onClick={handleRefresh} loading={checking} className="w-full">
              I've verified my email
            </Button>
            <Button
              variant="outlined"
              onClick={handleResend}
              loading={sending}
              disabled={sent}
              className="w-full"
            >
              {sent ? 'Email sent' : 'Resend verification email'}
            </Button>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-6 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Sign out
          </button>
        </Card>
      </div>
    </div>
  )
}

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const { sessionReady, token, user, restoreError, restoreSession, logout } = useAuth()

  if (!sessionReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Typography>Loading...</Typography>
      </div>
    )
  }

  // Token present but profile failed to load — avoid an empty dashboard shell.
  if (token && !user) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4">
        <Typography variant="h3">Couldn’t restore your session</Typography>
        <Typography variant="body" className="max-w-md text-center text-muted-foreground">
          {restoreError ?? 'Check your connection and try again.'}
        </Typography>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => void restoreSession()}>Try again</Button>
          <Button variant="outlined" onClick={logout}>
            Sign in again
          </Button>
        </div>
      </div>
    )
  }

  return children
}
