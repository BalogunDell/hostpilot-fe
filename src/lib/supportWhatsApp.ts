/**
 * Fallback when GET /public/support is unavailable (local marketing preview, deploy lag).
 * Production should serve SUPPORT_WHATSAPP_NUMBER from the API.
 */
const FALLBACK_SUPPORT_WHATSAPP = '09045692160'

function toWhatsAppE164Digits(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 11) {
    digits = `234${digits.slice(1)}`
  } else if (digits.length === 10 && digits.startsWith('9')) {
    digits = `234${digits}`
  } else if (digits.startsWith('2340') && digits.length === 14) {
    digits = `234${digits.slice(4)}`
  }
  return digits
}

function formatWhatsAppDisplay(raw: string): string {
  const digits = toWhatsAppE164Digits(raw)
  if (digits.startsWith('234') && digits.length === 13) {
    const local = `0${digits.slice(3)}`
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  }
  return raw.trim()
}

export function buildSupportWhatsApp(raw = FALLBACK_SUPPORT_WHATSAPP) {
  const number = raw.trim() || FALLBACK_SUPPORT_WHATSAPP
  return {
    whatsappNumber: number,
    whatsappDisplay: formatWhatsAppDisplay(number),
    whatsappLink: `https://wa.me/${toWhatsAppE164Digits(number)}`,
  }
}
