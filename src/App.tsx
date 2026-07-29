import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageLoaderSkeleton } from './components/Skeleton'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
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

/** App home: dashboard when signed in, otherwise login (marketing lives on hostsledger.com). */
function HomeRoute() {
  const { token, sessionReady, user } = useAuth()
  if (!sessionReady) return <PageLoader />
  if (!token || !user) return <Navigate to="/login" replace />
  if (!user.emailVerified) return <VerifyEmailGate />
  return <DashboardLayout />
}

function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<HomeRoute />}>
            <Route index element={<OverviewPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="pricing" element={<Navigate to="/settings" replace />} />
            <Route path="settings/pricing" element={<Navigate to="/settings" replace />} />
            <Route path="settings/team" element={<Navigate to="/settings#team" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <BrowserRouter>
              <AuthBootstrap>
                <AppRoutes />
              </AuthBootstrap>
            </BrowserRouter>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
