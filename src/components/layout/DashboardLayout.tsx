import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  FileBarChart2,
  LayoutDashboard,
  Receipt,
  Star,
  X,
} from 'lucide-react'
import { Button, Select, Typography } from '../../components'
import { ApiStatusBanner } from '../ApiStatusBanner'
import { ReadOnlyBanner } from '../ReadOnlyBanner'
import { PropertySelectModal } from '../PropertySelectModal'
import { useApp } from '../../context/AppContext'
import { useDashboardPeriod } from '../../context/DashboardPeriodContext'
import { useSelectedProperty } from '../../context/SelectedPropertyContext'
import { isBlockedReadOnlyAnchor } from '../../context/AppNavigation'
import { usePlanFeatures } from '../../hooks/usePlanFeatures'
import { cn } from '../../lib/cn'
import { DashboardTopBar } from './DashboardTopBar'
import { LogoutButton } from './LogoutButton'
import { ProfileSettingsButton } from './ProfileSettingsButton'
import { SidebarPlanPill } from './SidebarPlanPill'

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

interface NavItem {
  to: string
  label: string
  icon: NavIcon
  end?: boolean
}

const baseNavItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
]

const reportsNavItem: NavItem = { to: '/reports', label: 'Reports', icon: FileBarChart2 }
const reviewsNavItem: NavItem = { to: '/reviews', label: 'Reviews', icon: Star }

const mobileTabItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
]

function getPageMeta(pathname: string) {
  if (pathname === '/') {
    return { title: 'Overview' }
  }
  if (pathname.startsWith('/properties/')) {
    return { title: 'Property Details' }
  }
  if (pathname.startsWith('/properties')) {
    return { title: 'Your Properties' }
  }
  if (pathname.startsWith('/bookings')) {
    return { title: 'Bookings' }
  }
  if (pathname.startsWith('/calendar')) {
    return { title: 'Calendar' }
  }
  if (pathname.startsWith('/expenses')) {
    return { title: 'Expenses' }
  }
  if (pathname.startsWith('/reports')) {
    return { title: 'Reports' }
  }
  if (pathname.startsWith('/reviews')) {
    return { title: 'Reviews' }
  }
  if (pathname.startsWith('/settings') || pathname.startsWith('/pricing')) {
    return { title: 'Settings' }
  }
  return { title: 'HostsLedger' }
}

export function DashboardLayout() {
  const { readOnly } = useApp()
  const { selectedMonth, setSelectedMonth, monthOptions } = useDashboardPeriod()
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    propertiesLoading,
    properties,
  } = useSelectedProperty()
  const { hasMonthlyReports, hasUnlimitedReviewLinks } = usePlanFeatures()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navItems = [
    ...baseNavItems,
    ...(hasMonthlyReports ? [reportsNavItem] : []),
    // Growth+: unlimited review workflow. Starter still uses property detail / bookings.
    ...(hasUnlimitedReviewLinks ? [reviewsNavItem] : []),
  ]

  const pageMeta = getPageMeta(location.pathname)

  useEffect(() => {
    if (location.pathname.startsWith('/reports') && !hasMonthlyReports) {
      navigate('/', { replace: true })
      return
    }
    if (location.pathname.startsWith('/reviews') && !hasUnlimitedReviewLinks) {
      navigate('/', { replace: true })
    }
  }, [hasMonthlyReports, hasUnlimitedReviewLinks, location.pathname, navigate])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (!readOnly) return
    if (/^\/properties\/[^/]+/.test(location.pathname)) {
      navigate('/properties', { replace: true })
    }
  }, [readOnly, location.pathname, navigate])

  function sidebarLinkClass(isActive: boolean) {
    return cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-secondary-50 text-secondary dark:bg-secondary/20'
        : 'text-sidebar-foreground hover:bg-accent',
    )
  }

  function mobileTabClass(isActive: boolean) {
    return cn(
      'flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors',
      isActive ? 'text-secondary' : 'text-muted-foreground',
    )
  }

  function blockReadOnlyContentNavigation(event: React.MouseEvent<HTMLElement>) {
    if (!readOnly) return
    const anchor = (event.target as HTMLElement).closest('a[href]')
    if (!anchor) return
    if (anchor.hasAttribute('data-allow-readonly-nav')) return
    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('#')) return
    if (!isBlockedReadOnlyAnchor(href, readOnly)) return
    event.preventDefault()
    event.stopPropagation()
  }

  const propertyOptions = properties.map((property) => ({
    label: property.name,
    value: property.id,
  }))

  return (
    <div className="flex min-h-svh bg-background">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-sidebar p-4 transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-2 px-2">
          <div>
            <Typography variant="h3">HostsLedger</Typography>
            <SidebarPlanPill />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            allowWhenReadOnly
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) => sidebarLinkClass(isActive)}
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <LogoutButton showLabel className="hidden w-full lg:flex" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-svh">
        <header className="sticky top-0 z-30 border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex min-w-0 items-center gap-2.5 text-left"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-primary-900 text-tertiary">
                <BarChart3 className="size-4" aria-hidden />
              </span>
              <Typography variant="h4" className="truncate text-foreground">
                HostsLedger
              </Typography>
            </button>
            <ProfileSettingsButton />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="caption" className="w-16 shrink-0 text-muted-foreground">
                Property
              </Typography>
              <div className="min-w-0 flex-1">
                <Select
                  aria-label="Select property"
                  className="h-9 border-0 bg-muted text-sm"
                  value={selectedPropertyId ?? ''}
                  options={
                    propertyOptions.length > 0
                      ? propertyOptions
                      : [{ label: propertiesLoading ? 'Loading…' : 'No properties', value: '' }]
                  }
                  disabled={propertyOptions.length === 0}
                  onChange={(event) => {
                    if (event.target.value) setSelectedPropertyId(event.target.value)
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Typography variant="caption" className="w-16 shrink-0 text-muted-foreground">
                Viewing
              </Typography>
              <div className="min-w-0 flex-1">
                <Select
                  aria-label="Select month"
                  className="h-9 border-0 bg-muted text-sm"
                  value={selectedMonth}
                  options={monthOptions}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        <ApiStatusBanner />
        {readOnly ? <ReadOnlyBanner /> : null}

        <DashboardTopBar title={pageMeta.title} />

        <main
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6"
          onClickCapture={blockReadOnlyContentNavigation}
        >
          <Outlet />
        </main>

        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
            {mobileTabItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? false}
                  className={({ isActive }) => mobileTabClass(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'flex size-9 items-center justify-center rounded-xl transition-colors',
                          isActive && 'bg-secondary text-primary-foreground',
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>

      <PropertySelectModal />
    </div>
  )
}
