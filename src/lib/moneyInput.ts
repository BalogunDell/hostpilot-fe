export function sanitizeMoneyInput(raw: string, allowDecimals = false): string {
  if (allowDecimals) {
    const normalized = raw.replace(/,/g, '').replace(/[^\d.]/g, '')
    const [whole = '', ...rest] = normalized.split('.')
    const fraction = rest.join('').slice(0, 2)
    return fraction.length > 0 ? `${whole}.${fraction}` : whole
  }

  return raw.replace(/\D/g, '')
}

export function formatMoneyInputValue(raw: string, allowDecimals = false): string {
  const sanitized = sanitizeMoneyInput(raw, allowDecimals)
  if (!sanitized) return ''

  if (allowDecimals) {
    const [whole, fraction] = sanitized.split('.')
    const formattedWhole = whole ? Number(whole).toLocaleString('en-NG') : '0'
    return fraction !== undefined ? `${formattedWhole}.${fraction}` : formattedWhole
  }

  return Number(sanitized).toLocaleString('en-NG')
}

export function parseMoneyInput(value: string): number {
  const cleaned = value.replace(/,/g, '').trim()
  if (!cleaned) return 0
  return Number(cleaned)
}

export function formatMoneyInputNumber(amount: number, allowDecimals = false): string {
  if (!Number.isFinite(amount) || amount <= 0) return ''
  return formatMoneyInputValue(String(amount), allowDecimals)
}
