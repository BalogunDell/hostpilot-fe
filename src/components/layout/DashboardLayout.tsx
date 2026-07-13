import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  Calendar,
  LayoutDashboard,
  Plane,
  X,
} from 'lucide-react'
import { Button, Typography } from '../../components'
import { ApiStatusBanner } from '../ApiStatusBanner'
import { ReadOnlyBanner } from '../ReadOnlyBanner'
import { useApp } from '../../context/AppContext'
import { isBlockedReadOnlyAnchor } from '../../context/AppNavigation'
import { cn } from '../../lib/cn'
import { DashboardTopBar } from './DashboardTopBar'
import { LogoutButton } from './LogoutButton'
import { ProfileSettingsButton } from './ProfileSettingsButton'
import { SidebarPlanPill } from './SidebarPlanPill'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
] as const

const mobileTabItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
] as const

function getPageMeta(pathname: string) {
  if (pathname === '/') {
    return {
      title: 'Overview',
      searchPlaceholder: 'Search properties, guests, or payouts...',
    }
  }
  if (pathname.startsWith('/properties/')) {
    return { title: 'Property Details', searchPlaceholder: 'Search properties...' }
  }
  if (pathname.startsWith('/properties')) {
    return { title: 'Your Properties', searchPlaceholder: 'Search properties...' }
  }
  if (pathname.startsWith('/bookings')) {
    return { title: 'Bookings', searchPlaceholder: 'Search bookings...' }
  }
  if (pathname.startsWith('/calendar')) {
    return { title: 'Calendar', searchPlaceholder: 'Search events...' }
  }
  if (pathname.startsWith('/settings') || pathname.startsWith('/pricing')) {
    return { title: 'Settings', showSearch: false }
  }
  return { title: 'StayPilot', searchPlaceholder: 'Search...' }
}

export function DashboardLayout() {
  const { readOnly } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const visibleNavItems = navItems
  const pageMeta = getPageMeta(location.pathname)

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
            <Typography variant="h3">StayPilot</Typography>
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
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
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
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary-foreground">
              <Plane className="size-4" aria-hidden />
            </div>
            <Typography variant="h4" className="text-secondary">
              StayPilot
            </Typography>
          </div>
          <div className="flex items-center gap-1">
            <LogoutButton />
            <ProfileSettingsButton showName={false} />
          </div>
        </header>

        <ApiStatusBanner />
        {readOnly ? <ReadOnlyBanner /> : null}

        <DashboardTopBar
          title={pageMeta.title}
          searchPlaceholder={pageMeta.searchPlaceholder}
          showSearch={pageMeta.showSearch}
        />

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
                  end={'end' in item ? item.end : false}
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
    </div>
  )
}
