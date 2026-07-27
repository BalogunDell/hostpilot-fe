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
