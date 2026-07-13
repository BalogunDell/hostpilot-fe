const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'
const REQUEST_TIMEOUT_MS = 10_000

function requestSignal() {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  }
  const controller = new AbortController()
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  return controller.signal
}

let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

async function parseApiResponse<T>(response: Response, logoutOn401 = true): Promise<T> {
  const body = await response.json().catch(() => ({}))

  if (response.status === 401 && logoutOn401 && onUnauthorized) {
    onUnauthorized()
  }

  if (!response.ok) {
    const error = body as { error?: { message?: string; code?: string } }
    throw new ApiError(
      error.error?.message ?? 'Request failed',
      response.status,
      error.error?.code,
    )
  }

  return body as T
}

async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const { token, headers, ...rest } = options

  try {
    return await fetch(`${API_BASE}${path}`, {
      ...rest,
      signal: requestSignal(),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    throw new ApiError(
      timedOut
        ? 'API request timed out. Is the backend running on port 3000?'
        : 'Cannot reach the API. Start the backend with `npm run dev:api` (port 3000).',
      0,
      timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
    )
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null; logoutOn401?: boolean } = {},
): Promise<T> {
  const { logoutOn401 = true, ...rest } = options
  const response = await apiFetch(path, rest)
  const body = await parseApiResponse<{ data: T }>(response, logoutOn401)
  return body.data
}

export async function apiRequestPaginated<T>(
  path: string,
  options: RequestInit & { token?: string | null; logoutOn401?: boolean } = {},
): Promise<{ data: T[]; meta: PaginationMeta }> {
  const { logoutOn401 = true, ...rest } = options
  const response = await apiFetch(path, rest)
  const body = await parseApiResponse<{ data: T[]; meta: PaginationMeta }>(
    response,
    logoutOn401,
  )
  return { data: body.data, meta: body.meta }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiRequest<{ status: string }>('/health')
    return true
  } catch {
    return false
  }
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export async function fetchPropertyReportPdf(propertyId: string, token: string | null) {
  if (!token) {
    throw new ApiError('Not authenticated', 401)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}/dashboard/properties/${propertyId}/reports/export`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: requestSignal(),
    })
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    throw new ApiError(
      timedOut
        ? 'Report download timed out. Please try again.'
        : 'Cannot reach the API. Start the backend with `npm run dev:api` (port 3000).',
      0,
      timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
    )
  }

  if (response.status === 401 && onUnauthorized) {
    onUnauthorized()
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = body as { error?: { message?: string; code?: string } }
    throw new ApiError(
      error.error?.message ?? 'Failed to load report',
      response.status,
      error.error?.code,
    )
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition')
  const filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ??
    `staypilot-property-report-${propertyId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`

  return { blob, filename }
}

export async function downloadPropertyReportPdf(propertyId: string, token: string | null) {
  const { blob, filename } = await fetchPropertyReportPdf(propertyId, token)

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function viewPropertyReportPdf(propertyId: string, token: string | null) {
  const { blob } = await fetchPropertyReportPdf(propertyId, token)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
