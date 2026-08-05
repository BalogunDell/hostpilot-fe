import { format, startOfMonth, subMonths } from 'date-fns'

export function buildMonthOptions(count = 12) {
  return Array.from({ length: count }, (_, index) => {
    const date = startOfMonth(subMonths(new Date(), index))
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
    }
  })
}

export function currentMonthValue() {
  return format(new Date(), 'yyyy-MM')
}

export function monthToDateRange(month: string) {
  const start = startOfMonth(new Date(`${month}-01T00:00:00`))
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  return {
    start,
    end,
    from: format(start, 'yyyy-MM-dd'),
    to: format(end, 'yyyy-MM-dd'),
    label: format(start, 'MMMM yyyy'),
  }
}
