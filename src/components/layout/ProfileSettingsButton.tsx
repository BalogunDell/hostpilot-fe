import { useEffect, useId, useRef, useState } from 'react'
import { LogOut, Menu, MessageSquare, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Typography } from '../Typography'
import { FeedbackDialog } from '../FeedbackDialog'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'

interface ProfileSettingsButtonProps {
  className?: string
  /** @deprecated Avatar/name trigger removed; kept for call-site compatibility. */
  showName?: boolean
}

export function ProfileSettingsButton({ className }: ProfileSettingsButtonProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const displayName = user?.name ?? 'User'
  const role = user?.role === 'COHOST' ? 'Co-host' : 'Admin'

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function goToSettings() {
    setOpen(false)
    navigate('/settings')
  }

  function openFeedback() {
    setOpen(false)
    setFeedbackOpen(true)
  }

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div ref={containerRef} className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
        >
          <Menu className="size-5" aria-hidden />
        </button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-md"
          >
            <div className="border-b border-border px-3 py-2">
              <Typography variant="label" className="block truncate">
                {displayName}
              </Typography>
              <Typography variant="caption" className="block truncate text-muted-foreground">
                {user?.email ?? role}
              </Typography>
            </div>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              onClick={goToSettings}
            >
              <Settings className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              onClick={openFeedback}
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              Send feedback
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-accent"
              onClick={handleLogout}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Log out
            </button>
          </div>
        ) : null}
      </div>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} source="app" />
    </>
  )
}
