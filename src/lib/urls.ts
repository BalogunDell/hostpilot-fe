/**
 * Domain helpers for marketing ↔ app split.
 *
 * In production the marketing site (hostsledger.com) and the app
 * (app.hostsledger.com) are separate origins, so CTAs must use absolute URLs.
 * Locally everything runs on one Vite origin, so we keep paths relative.
 */

const isDev = import.meta.env.DEV

export const APP_URL =
  import.meta.env.VITE_APP_URL ?? (isDev ? '' : 'https://app.hostsledger.com')

export const SITE_URL =
  import.meta.env.VITE_SITE_URL ?? (isDev ? '/' : 'https://hostsledger.com')

export const LOGIN_URL = `${APP_URL}/login`
export const REGISTER_URL = `${APP_URL}/register`

function hostname(): string {
  if (typeof window === 'undefined') return ''
  return window.location.hostname.toLowerCase()
}

/** True on the public marketing domain (not the app subdomain). */
export function isMarketingHost(): boolean {
  const host = hostname()
  return host === 'hostsledger.com' || host === 'www.hostsledger.com'
}

/** True on the product app domain (or local/dev). */
export function isAppHost(): boolean {
  if (isDev) return true
  const host = hostname()
  return host === 'app.hostsledger.com' || host.endsWith('.app.hostsledger.com')
}

/** Absolute app URL for a path (used when leaving the marketing site). */
export function appHref(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!APP_URL) return normalized
  return `${APP_URL}${normalized}`
}
