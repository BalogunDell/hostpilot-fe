import { BOOKING_PLATFORM_FEE_PER_NIGHT_NGN, BOOKING_VAT_PERCENT } from '@staypilot/shared'
import { formatNaira } from '../api/client'
import { formatBookingDisplayDate } from './bookingDates'

export interface BookingPaymentReceiptData {
  propertyName: string
  guestName: string
  guestEmail?: string | null
  checkIn: string
  checkOut: string
  nights: number
  stayAmountNgn: number
  platformFeeNgn: number
  vatNgn: number
  totalNgn: number
  reference: string
  paidAt?: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function downloadBookingPaymentReceipt(data: BookingPaymentReceiptData) {
  const stayRange = `${formatBookingDisplayDate(data.checkIn)} → ${formatBookingDisplayDate(data.checkOut)}`
  const paidAtLabel = data.paidAt
    ? new Date(data.paidAt).toLocaleString()
    : new Date().toLocaleString()
  const feeLabel =
    data.nights > 0
      ? `Service fee (₦${BOOKING_PLATFORM_FEE_PER_NIGHT_NGN.toLocaleString()} × ${data.nights} night${data.nights === 1 ? '' : 's'})`
      : 'Service fee'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>HostsLedger payment receipt</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #111827; margin: 40px; line-height: 1.5; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .muted { color: #6b7280; font-size: 14px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-top: 20px; max-width: 520px; }
    .row { display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; font-size: 15px; }
    .total { border-top: 1px solid #e5e7eb; margin-top: 12px; padding-top: 12px; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Payment receipt</h1>
  <p class="muted">HostsLedger · Guest booking payment</p>
  <div class="card">
    <div class="row"><span>Property</span><strong>${escapeHtml(data.propertyName)}</strong></div>
    <div class="row"><span>Guest</span><strong>${escapeHtml(data.guestName)}</strong></div>
    ${data.guestEmail ? `<div class="row"><span>Email</span><strong>${escapeHtml(data.guestEmail)}</strong></div>` : ''}
    <div class="row"><span>Stay</span><strong>${escapeHtml(stayRange)}</strong></div>
    <div class="row"><span>Stay amount</span><strong>${escapeHtml(formatNaira(data.stayAmountNgn))}</strong></div>
    <div class="row"><span>${escapeHtml(feeLabel)}</span><strong>${escapeHtml(formatNaira(data.platformFeeNgn))}</strong></div>
    ${
      data.vatNgn > 0
        ? `<div class="row"><span>VAT (${BOOKING_VAT_PERCENT}% on fee)</span><strong>${escapeHtml(formatNaira(data.vatNgn))}</strong></div>`
        : ''
    }
    <div class="row total"><span>Total paid</span><strong>${escapeHtml(formatNaira(data.totalNgn))}</strong></div>
    <div class="row"><span>Reference</span><strong>${escapeHtml(data.reference)}</strong></div>
    <div class="row"><span>Paid at</span><strong>${escapeHtml(paidAtLabel)}</strong></div>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeRef = data.reference.replace(/[^\w.-]+/g, '_').slice(0, 40)
  anchor.href = url
  anchor.download = `hostsledger-receipt-${safeRef || 'payment'}.html`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
