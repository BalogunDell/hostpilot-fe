import { useMutation, useQuery } from '@tanstack/react-query'
import { endOfMonth, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Select } from './Select'
import { Typography } from './Typography'
import { apiRequestPaginated } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'

interface Property {
  id: string
  name: string
}

interface Expense {
  category: string
  amount: number
  description?: string | null
  expenseDate: string
}

interface CopyExpensesDialogProps {
  open: boolean
  onClose: () => void
  targetPropertyId: string
  targetPropertyName: string
  onCopied?: () => void
}

function monthKey(date: string) {
  return format(startOfMonth(parseISO(date)), 'yyyy-MM-dd')
}

function defaultSourceMonth(availableMonths: string[]) {
  if (availableMonths.length === 0) return ''
  const previousMonth = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  if (availableMonths.includes(previousMonth)) return previousMonth
  return availableMonths[0]!
}

export function CopyExpensesDialog({
  open,
  onClose,
  targetPropertyId,
  targetPropertyName,
  onCopied,
}: CopyExpensesDialogProps) {
  const api = useApi()
  const { token } = useAuth()
  const { showToast } = useToast()

  const [sourcePropertyId, setSourcePropertyId] = useState(targetPropertyId)
  const [sourceMonth, setSourceMonth] = useState('')
  const [formError, setFormError] = useState('')

  const targetMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const targetMonthLabel = format(new Date(), 'MMMM yyyy')

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api<Property[]>('/properties'),
    enabled: Boolean(token) && open,
  })

  const { data: sourceExpenses, isLoading: monthsLoading } = useQuery({
    queryKey: ['expenses', 'copy-source', sourcePropertyId],
    queryFn: () =>
      apiRequestPaginated<Expense>(
        `/expenses?propertyId=${sourcePropertyId}&limit=500`,
        { token },
      ),
    enabled: Boolean(token && open && sourcePropertyId),
  })

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    for (const expense of sourceExpenses?.data ?? []) {
      months.add(monthKey(expense.expenseDate))
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [sourceExpenses?.data])

  useEffect(() => {
    if (!open) return
    setSourcePropertyId(targetPropertyId)
    setFormError('')
  }, [open, targetPropertyId])

  useEffect(() => {
    if (!open || monthsLoading) return
    setSourceMonth(defaultSourceMonth(availableMonths))
  }, [open, sourcePropertyId, availableMonths, monthsLoading])

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (!sourcePropertyId) throw new Error('Select a property to copy from')
      if (!sourceMonth) throw new Error('Select a month to copy from')

      const sourceMonthEnd = format(endOfMonth(parseISO(sourceMonth)), 'yyyy-MM-dd')
      const sourceMonthLabel = format(parseISO(sourceMonth), 'MMMM yyyy')

      const previous = await apiRequestPaginated<Expense>(
        `/expenses?propertyId=${sourcePropertyId}&from=${sourceMonth}&to=${sourceMonthEnd}&limit=100`,
        { token },
      )

      if (previous.data.length === 0) {
        throw new Error(`No expenses found for ${sourceMonthLabel}`)
      }

      await Promise.all(
        previous.data.map((expense) =>
          api('/expenses', {
            method: 'POST',
            body: JSON.stringify({
              propertyId: targetPropertyId,
              category: expense.category,
              amount: expense.amount,
              description: expense.description ?? undefined,
              expenseDate: targetMonthStart,
            }),
          }),
        ),
      )

      return { count: previous.data.length, sourceMonthLabel }
    },
    onSuccess: ({ count, sourceMonthLabel }) => {
      showToast(
        `Copied ${count} expense${count === 1 ? '' : 's'} from ${sourceMonthLabel} into ${targetMonthLabel}.`,
      )
      onCopied?.()
      onClose()
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Failed to copy expenses')
    },
  })

  function handleSubmit() {
    setFormError('')
    copyMutation.mutate()
  }

  const sourcePropertyName =
    properties.find((property) => property.id === sourcePropertyId)?.name ?? 'selected property'
  const sourceMonthLabel = sourceMonth
    ? format(parseISO(sourceMonth), 'MMMM yyyy')
    : 'selected month'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Copy from property"
      description={`Copy recurring expenses into ${targetPropertyName} for ${targetMonthLabel}.`}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4 border-t border-border pt-5">
        {propertiesLoading ? (
          <Typography variant="caption" className="text-muted-foreground">
            Loading properties…
          </Typography>
        ) : properties.length === 0 ? (
          <Typography variant="caption" className="text-muted-foreground">
            Add a property first.
          </Typography>
        ) : (
          <>
            <Select
              label="Copy from property"
              value={sourcePropertyId}
              onChange={(event) => setSourcePropertyId(event.target.value)}
              options={properties.map((property) => ({
                label:
                  property.id === targetPropertyId
                    ? `${property.name} (this property)`
                    : property.name,
                value: property.id,
              }))}
            />
            <Select
              label="Month"
              value={sourceMonth}
              onChange={(event) => setSourceMonth(event.target.value)}
              disabled={monthsLoading || availableMonths.length === 0}
              options={availableMonths.map((month) => ({
                label: format(parseISO(month), 'MMMM yyyy'),
                value: month,
              }))}
              placeholder={
                monthsLoading
                  ? 'Loading months…'
                  : availableMonths.length === 0
                    ? 'No expenses for this property'
                    : 'Select month'
              }
            />
          </>
        )}

        {sourceMonth ? (
          <Typography variant="caption" className="text-muted-foreground">
            Expenses from {sourceMonthLabel} on {sourcePropertyName} will be added to this
            month&apos;s list for {targetPropertyName}. Existing entries are kept.
          </Typography>
        ) : null}

        {formError ? (
          <Typography variant="caption" className="text-destructive">
            {formError}
          </Typography>
        ) : null}

        <div className="flex gap-3 border-t border-border pt-4">
          <Button variant="outlined" className="flex-1 bg-card" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={copyMutation.isPending}
            disabled={properties.length === 0 || !sourceMonth}
            onClick={handleSubmit}
          >
            Copy expenses
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
