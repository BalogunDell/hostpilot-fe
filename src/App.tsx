import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PageLoaderSkeleton } from './components/Skeleton'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import {
  AuthBootstrap,
  LoginPage,
  OnboardingPage,
  RegisterPage,
} from './pages/auth/AuthPages'

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, sessionReady } = useAuth()
  if (!sessionReady) return <PageLoader />
  if (!token) return <Navigate to="/login" replace />
  return children
}

/** Root: marketing landing for guests, dashboard for authenticated users. */
function HomeRoute() {
  const { token, sessionReady } = useAuth()
  if (!sessionReady) return <PageLoader />
  if (!token) return <LandingPage />
  return <DashboardLayout />
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
