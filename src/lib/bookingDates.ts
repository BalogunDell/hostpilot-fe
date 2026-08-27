import { addDays, addMonths, format, isBefore, isValid, parseISO } from 'date-fns'

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
  // Checkout day counts — guest has left (or is leaving) that calendar day.
  return checkout <= today
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

function toDateOnly(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function maxDateOnly(a: string, b: string) {
  return a >= b ? a : b
}

function minDateOnly(a: string, b: string) {
  return a <= b ? a : b
}

/**
 * Open stay windows (check-in → check-out) within [fromDate, toDate]
 * that do not overlap existing bookings. Checkout day is exclusive.
 */
export function computeAvailableStayRanges(
  bookings: BookingDateRange[],
  fromDate: string,
  toDate: string,
): BookingDateRange[] {
  if (!fromDate || !toDate || fromDate >= toDate) return []

  const sorted = [...bookings]
    .filter((booking) => booking.checkIn < booking.checkOut)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))

  const gaps: BookingDateRange[] = []
  let cursor = fromDate

  for (const booking of sorted) {
    if (booking.checkOut <= fromDate) continue
    if (booking.checkIn >= toDate) break

    const gapEnd = minDateOnly(booking.checkIn, toDate)
    if (cursor < gapEnd) {
      gaps.push({ checkIn: cursor, checkOut: gapEnd })
    }
    cursor = maxDateOnly(cursor, booking.checkOut)
  }

  if (cursor < toDate) {
    gaps.push({ checkIn: cursor, checkOut: toDate })
  }

  return gaps
}

/** Default availability window: today through 12 months ahead (or later if bookings extend past). */
export function defaultAvailabilityWindow(bookings: BookingDateRange[], now = new Date()) {
  const today = toDateOnly(now)
  let end = toDateOnly(addMonths(now, 12))
  for (const booking of bookings) {
    if (booking.checkOut > end) end = booking.checkOut
  }
  return { fromDate: today, toDate: end }
}

/** Upcoming booked stays (check-out still on/after today), oldest first. */
export function upcomingBookedRanges(bookings: BookingDateRange[], today = toDateOnly(new Date())) {
  return [...bookings]
    .filter((booking) => booking.checkOut > today)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
}

/** Map booking dates to react-big-calendar all-day event bounds. */
export function bookingToCalendarEvent(checkIn: string, checkOut: string) {
  const start = parseBookingDate(checkIn)
  const checkout = parseBookingDate(checkOut)
  if (!start || !checkout) return null

  return {
    start,
    // checkOut is the departure day (exclusive of occupied nights). RBC all-day
    // `end` is also exclusive, so pass checkout directly — do not add a day or the
    // checkout date looks booked and WhatsApp/app correctly allow a same-day check-in.
    end: checkout,
    allDay: true as const,
  }
}
