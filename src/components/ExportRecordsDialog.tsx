import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button, Dialog, Input, Select, Typography } from '.'
import { apiRequestPaginated } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useDashboardPeriod } from '../context/DashboardPeriodContext'
import { useToast } from '../context/ToastContext'

interface Booking {
  id: string
  propertyId: string
  guestName: string
  checkIn: string
  checkOut: string
  amount: number
  source: string
}

interface Expense {
  id: string
  propertyId: string
  category: string
  amount: number
  expenseDate: string
  description?: string | null
}

interface Property {
  id: string
  name: string
}

type ExportType = 'bookings' | 'expenses' | 'both'

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

interface ExportRecordsDialogProps {
  open: boolean
  onClose: () => void
  properties: Property[]
  defaultPropertyId?: string
}

export function ExportRecordsDialog({
  open,
  onClose,
  properties,
  defaultPropertyId = '',
}: ExportRecordsDialogProps) {
  const { token } = useAuth()
  const { showToast } = useToast()
  const { from: monthFrom, to: monthTo } = useDashboardPeriod()

  const [from, setFrom] = useState(monthFrom)
  const [to, setTo] = useState(monthTo)
  const [propertyId, setPropertyId] = useState(defaultPropertyId)
  const [exportType, setExportType] = useState<ExportType>('bookings')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFrom(monthFrom)
    setTo(monthTo)
    setPropertyId(defaultPropertyId)
    setExportType('bookings')
    setError('')
  }, [open, monthFrom, monthTo, defaultPropertyId])

  const propertyOptions = useMemo(
    () => [
      { label: 'All properties', value: '' },
      ...properties.map((property) => ({ label: property.name, value: property.id })),
    ],
    [properties],
  )

  const propertyMap = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties],
  )

  async function handleExport() {
    if (!token) return
    if (!from || !to) {
      setError('Choose a start and end date')
      return
    }
    if (from > to) {
      setError('Start date must be on or before end date')
      return
    }

    setExporting(true)
    setError('')

    try {
      const propertyQuery = propertyId ? `&propertyId=${propertyId}` : ''
      let bookingCount = 0
      let expenseCount = 0

      if (exportType === 'bookings' || exportType === 'both') {
        const bookings = await apiRequestPaginated<Booking>(
          `/bookings?from=${from}&to=${to}${propertyQuery}&limit=500`,
          { token },
        )
        const rows = bookings.data.map((booking) => [
          booking.guestName,
          propertyMap.get(booking.propertyId)?.name ?? booking.propertyId,
          booking.checkIn,
          booking.checkOut,
          String(booking.amount),
          booking.source,
        ])
        downloadCsv(
          `bookings-${from}-to-${to}.csv`,
          ['Guest', 'Property', 'Check-in', 'Check-out', 'Amount', 'Source'],
          rows,
        )
        bookingCount = rows.length
      }

      if (exportType === 'expenses' || exportType === 'both') {
        const expenses = await apiRequestPaginated<Expense>(
          `/expenses?from=${from}&to=${to}${propertyQuery}&limit=500`,
          { token },
        )
        const rows = expenses.data.map((expense) => [
          propertyMap.get(expense.propertyId)?.name ?? expense.propertyId,
          expense.category,
          expense.expenseDate,
          String(expense.amount),
          expense.description ?? '',
        ])
        downloadCsv(
          `expenses-${from}-to-${to}.csv`,
          ['Property', 'Category', 'Date', 'Amount', 'Description'],
          rows,
        )
        expenseCount = rows.length
      }

      const parts: string[] = []
      if (exportType === 'bookings' || exportType === 'both') {
        parts.push(`${bookingCount} booking${bookingCount === 1 ? '' : 's'}`)
      }
      if (exportType === 'expenses' || exportType === 'both') {
        parts.push(`${expenseCount} expense${expenseCount === 1 ? '' : 's'}`)
      }
      showToast(`Exported ${parts.join(' and ')}`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export records"
      description="Download bookings and expenses for a custom date range."
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        <Select
          label="Property"
          value={propertyId}
          options={propertyOptions}
          onChange={(event) => setPropertyId(event.target.value)}
        />

        <Select
          label="Records"
          value={exportType}
          options={[
            { label: 'Bookings', value: 'bookings' },
            { label: 'Expenses', value: 'expenses' },
            { label: 'Bookings and expenses', value: 'both' },
          ]}
          onChange={(event) => setExportType(event.target.value as ExportType)}
        />

        {error ? (
          <Typography variant="caption" className="text-destructive">
            {error}
          </Typography>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outlined" onClick={onClose} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? 'Exporting…' : 'Download CSV'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
