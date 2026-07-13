import { Link, type LinkProps, useNavigate, type NavigateOptions, type To } from 'react-router-dom'
import { useCallback } from 'react'
import { cn } from '../lib/cn'
import { useApp } from './AppContext'

export interface AppLinkProps extends LinkProps {
  /** Allow navigation when the account is read-only (e.g. renew / upgrade CTAs). */
  allowWhenReadOnly?: boolean
}

export function AppLink({
  allowWhenReadOnly = false,
  to,
  onClick,
  className,
  children,
  ...props
}: AppLinkProps) {
  const { readOnly } = useApp()

  if (readOnly && !allowWhenReadOnly) {
    return (
      <span
        className={cn(className, 'cursor-not-allowed opacity-50')}
        aria-disabled="true"
      >
        {children}
      </span>
    )
  }

  return (
    <Link to={to} onClick={onClick} className={className} {...props}>
      {children}
    </Link>
  )
}

export function useGuardedNavigate() {
  const navigate = useNavigate()
  const { readOnly } = useApp()

  return useCallback(
    (to: To, options?: NavigateOptions) => {
      if (readOnly) return
      navigate(to, options)
    },
    [navigate, readOnly],
  )
}

/** Block in-content anchor clicks when read-only (side nav lives outside `<main>`). */
export function isBlockedReadOnlyAnchor(href: string | null, readOnly: boolean) {
  if (!readOnly || !href) return false
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false
  }
  if (!href.startsWith('/') || href.startsWith('//')) return false
  return true
}
