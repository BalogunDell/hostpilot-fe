import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Button, Card, Input, Typography, WhatsAppBusinessInfoBanner } from '../../components'
import { ApiStatusBanner } from '../../components/ApiStatusBanner'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { usePlanFeatures } from '../../hooks/usePlanFeatures'
import {
  WHATSAPP_BUSINESS_PHONE_LABEL,
} from '../../lib/whatsappCopy'

/** HostsLedger brand lockup shown on unauthenticated pages. */
function AuthBrand() {
  return (
    <a
      href="https://www.hostsledger.com"
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
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
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
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
  const [propertyName, setPropertyName] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      if (hasWhatsApp && phone.trim()) {
        await api('/whatsapp/link', {
          method: 'POST',
          body: JSON.stringify({ phoneNumber: phone }),
        })
      }
      await api('/properties', {
        method: 'POST',
        body: JSON.stringify({ name: propertyName, location }),
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
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
          <Input
            label={WHATSAPP_BUSINESS_PHONE_LABEL}
            placeholder="+234..."
            value={phone}
            disabled={!hasWhatsApp}
            onChange={(e) => setPhone(e.target.value)}
          />
          {!hasWhatsApp ? (
            <Typography variant="caption" className="text-muted-foreground">
              <a href="/settings#pricing" className="font-medium text-secondary hover:underline">
                Upgrade to Growth
              </a>{' '}
              to enable WhatsApp booking entry.
            </Typography>
          ) : null}
          <Input label="Property name" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          {error ? <Typography variant="caption" className="text-destructive">{error}</Typography> : null}
          <Button type="submit">Complete setup</Button>
        </form>
      </Card>
    </div>
  )
}

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const { sessionReady } = useAuth()

  if (!sessionReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Typography>Loading...</Typography>
      </div>
    )
  }

  return children
}
