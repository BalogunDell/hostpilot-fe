import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageLoaderSkeleton } from './components/Skeleton'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardPeriodProvider } from './context/DashboardPeriodContext'
import { SelectedPropertyProvider } from './context/SelectedPropertyContext'
import { ToastProvider } from './context/ToastContext'
import {
  AuthBootstrap,
  ForgotPasswordPage,
  LoginPage,
  OnboardingPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailGate,
  VerifyEmailPage,
} from './pages/auth/AuthPages'
import { Button, Typography } from './components'
import { appHref, isMarketingHost } from './lib/urls'

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
)
const OverviewPage = lazy(() =>
  import('./pages/OverviewPage').then((m) => ({ default: m.OverviewPage })),
)
const PropertiesPage = lazy(() =>
  import('./pages/PropertiesPage').then((m) => ({ default: m.PropertiesPage })),
)
const PropertyDetailPage = lazy(() =>
  import('./pages/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage })),
)
const CalendarPage = lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const BookingsPage = lazy(() =>
  import('./pages/BookingsPage').then((m) => ({ default: m.BookingsPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const CoHostInviteAcceptPage = lazy(() =>
  import('./pages/CoHostInviteAcceptPage').then((m) => ({ default: m.CoHostInviteAcceptPage })),
)
const PublicListingPage = lazy(() =>
  import('./pages/PublicListingPage').then((m) => ({ default: m.PublicListingPage })),
)
const ReviewSubmitPage = lazy(() =>
  import('./pages/ReviewSubmitPage').then((m) => ({ default: m.ReviewSubmitPage })),
)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })),
)
const ReportsPage = lazy(() =>
  import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const ReviewsPage = lazy(() =>
  import('./pages/ReviewsPage').then((m) => ({ default: m.ReviewsPage })),
)
const ExpensesPage = lazy(() =>
  import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })),
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function PageLoader() {
  return <PageLoaderSkeleton />
}

/** Hard navigation to the app origin (cross-subdomain). */
function RedirectToApp({ path }: { path?: string }) {
  const location = useLocation()
  const target = appHref(path ?? `${location.pathname}${location.search}${location.hash}`)

  useEffect(() => {
    window.location.replace(target)
  }, [target])

  return <PageLoader />
}

class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render failed', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4">
          <Typography variant="h3">Something went wrong</Typography>
          <Typography variant="body" className="text-center text-muted-foreground">
            The page failed to load. Try refreshing.
          </Typography>
          <Button onClick={() => window.location.assign('/')}>Reload app</Button>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, sessionReady, user } = useAuth()
  const location = useLocation()
  if (!sessionReady) return <PageLoader />
  if (!token || !user) {
    const redirect = `${location.pathname}${location.search}`
    return (
      <Navigate
        to={redirect && redirect !== '/' ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
        replace
      />
    )
  }
  if (!user.emailVerified) return <VerifyEmailGate />
  return children
}

/** App home on app.hostsledger.com: dashboard when signed in, otherwise login. */
function AppHomeRoute() {
  const { token, sessionReady, user } = useAuth()
  if (!sessionReady) return <PageLoader />
  if (!token || !user) return <Navigate to="/login" replace />
  if (user.isPlatformAdmin) return <Navigate to="/admin" replace />
  if (!user.emailVerified) return <VerifyEmailGate />
  return (
    <DashboardPeriodProvider>
      <SelectedPropertyProvider>
        <DashboardLayout />
      </SelectedPropertyProvider>
    </DashboardPeriodProvider>
  )
}

function MarketingRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      {/* Auth + product routes live on the app subdomain */}
      <Route path="/login" element={<RedirectToApp path="/login" />} />
      <Route path="/register" element={<RedirectToApp path="/register" />} />
      <Route path="/forgot-password" element={<RedirectToApp path="/forgot-password" />} />
      <Route path="/reset-password/:token" element={<RedirectToApp />} />
      <Route path="/verify-email/:token" element={<RedirectToApp />} />
      <Route path="/onboarding" element={<RedirectToApp path="/onboarding" />} />
      <Route path="/properties/*" element={<RedirectToApp />} />
      <Route path="/bookings" element={<RedirectToApp path="/bookings" />} />
      <Route path="/calendar" element={<RedirectToApp path="/calendar" />} />
      <Route path="/expenses" element={<RedirectToApp path="/expenses" />} />
      <Route path="/reports" element={<RedirectToApp path="/reports" />} />
      <Route path="/reviews" element={<RedirectToApp path="/reviews" />} />
      <Route path="/settings/*" element={<RedirectToApp />} />
      <Route path="/pricing" element={<RedirectToApp path="/settings" />} />
      <Route path="/admin" element={<RedirectToApp path="/admin" />} />
      <Route path="/cohost-invite/:token" element={<RedirectToApp />} />
      <Route path="/listings/:slug" element={<RedirectToApp />} />
      <Route path="/review/:token" element={<RedirectToApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppProductRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/cohost-invite/:token" element={<CoHostInviteAcceptPage />} />
      <Route path="/listings/:slug" element={<PublicListingPage />} />
      <Route path="/review/:token" element={<ReviewSubmitPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<AppHomeRoute />}>
        <Route index element={<OverviewPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="pricing" element={<Navigate to="/settings" replace />} />
        <Route path="settings/pricing" element={<Navigate to="/settings" replace />} />
        <Route path="settings/team" element={<Navigate to="/settings#team" replace />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppRoutes() {
  const marketing = isMarketingHost()

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {marketing ? <MarketingRoutes /> : <AppProductRoutes />}
      </Suspense>
    </RouteErrorBoundary>
  )
}

/** Skip session restore chrome on the public marketing site. */
function HostAwareBootstrap({ children }: { children: ReactNode }) {
  if (isMarketingHost()) return children
  return <AuthBootstrap>{children}</AuthBootstrap>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <BrowserRouter>
              <HostAwareBootstrap>
                <AppRoutes />
              </HostAwareBootstrap>
            </BrowserRouter>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
