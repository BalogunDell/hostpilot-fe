import { addDays, format, isBefore, isValid, parseISO } from 'date-fns'

export interface BookingDateRange {
  checkIn: string
  checkOut: string
}

export function bookingRangesOverlap(a: BookingDateRange, b: BookingDateRange) {
  const aStart = parseISO(a.checkIn)
  const aEnd = parseISO(a.checkOut)
  const bStart = parseISO(b.checkIn)
  const bEnd = parseISO(b.checkOut)
  return aStart < bEnd && aEnd > bStart
}

export function isDateWithinBooking(dateStr: string, booking: BookingDateRange) {
  const day = parseISO(dateStr)
  const start = parseISO(booking.checkIn)
  const end = parseISO(booking.checkOut)
  return day >= start && day < end
}

export function isCheckInDateBlocked(dateStr: string, bookings: BookingDateRange[]) {
  return bookings.some((booking) => isDateWithinBooking(dateStr, booking))
}

export function isStayRangeAvailable(
  checkIn: string,
  checkOut: string,
  bookings: BookingDateRange[],
) {
  if (!checkIn || !checkOut) return true
  if (parseISO(checkOut) <= parseISO(checkIn)) return false
  return !bookings.some((booking) => bookingRangesOverlap({ checkIn, checkOut }, booking))
}

export function parseBookingDate(value: string) {
  const date = parseISO(value.includes('T') ? value : `${value}T12:00:00`)
  return isValid(date) ? date : null
}

/** e.g. Thu, 30th May, 2026 */
export function formatBookingDisplayDate(value: string) {
  const date = parseBookingDate(value)
  return date ? format(date, 'EEE, do MMM, yyyy') : '—'
}

export function isPastCheckout(checkOut: string): boolean {
  const checkout = parseBookingDate(checkOut)
  if (!checkout) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  checkout.setHours(0, 0, 0, 0)
  return checkout < today
}

export function formatBlockedRange(booking: BookingDateRange) {
  return `${format(parseISO(booking.checkIn), 'MMM d')} – ${format(parseISO(booking.checkOut), 'MMM d, yyyy')}`
}

export function minCheckOutDate(checkIn: string) {
  if (!checkIn) return undefined
  return format(addDays(parseISO(checkIn), 1), 'yyyy-MM-dd')
}

export function validateBookingDates(
  checkIn: string,
  checkOut: string,
  bookings: BookingDateRange[],
) {
  if (!checkIn || !checkOut) return null

  if (isCheckInDateBlocked(checkIn, bookings)) {
    return 'Check-in date falls within an existing booking.'
  }

  if (!isBefore(parseISO(checkIn), parseISO(checkOut))) {
    return 'Check-out must be after check-in.'
  }

  if (!isStayRangeAvailable(checkIn, checkOut, bookings)) {
    return 'These dates overlap with an existing booking for this property.'
  }

  return null
}

/** Map booking dates to react-big-calendar all-day event bounds. */
export function bookingToCalendarEvent(checkIn: string, checkOut: string) {
  const start = parseBookingDate(checkIn)
  const checkout = parseBookingDate(checkOut)
  if (!start || !checkout) return null

  return {
    start,
    // checkOut is the guest's checkout day; extend one day for exclusive all-day rendering.
    end: addDays(checkout, 1),
    allDay: true as const,
  }
}
