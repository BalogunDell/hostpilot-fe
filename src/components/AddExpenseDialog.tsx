import { useMutation } from '@tanstack/react-query'
import { addMonths, format, parseISO } from 'date-fns'
import { RefreshCw, Shapes } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Input } from './Input'
import { MoneyInput } from './MoneyInput'
import { Select } from './Select'
import { Typography } from './Typography'
import { useApi } from '../hooks/useApi'
import { useSelectedMonth } from '../hooks/useSelectedMonth'
import { useActionsDisabled } from '../context/AppContext'
import { cn } from '../lib/cn'
import { currentMonthValue } from '../lib/monthPeriod'
import { parseMoneyInput } from '../lib/moneyInput'
import { EXPENSE_CATEGORIES } from '../lib/propertyMetrics'

interface AddExpenseDialogProps {
  open: boolean
  onClose: () => void
  propertyId: string
  propertyName: string
  /** When provided, the property field becomes selectable. */
  propertyOptions?: Array<{ id: string; name: string }>
  onPropertyChange?: (propertyId: string) => void
  /** Defaults the date picker when the dialog opens. */
  defaultExpenseDate?: string
  onAdded?: () => void
}

function FieldLabel({ children, htmlFor }: { children: string; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
    >
      {children}
    </label>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}) {
  const actionsDisabled = useActionsDisabled()

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={actionsDisabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50',
        checked ? 'bg-secondary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/** Same calendar day next month, clamped to that month's last day. */
function sameDayNextMonth(dateOnly: string): string {
  const date = parseISO(dateOnly)
  const next = addMonths(new Date(date.getFullYear(), date.getMonth(), 1), 1)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  const day = Math.min(date.getDate(), lastDay)
  return format(new Date(next.getFullYear(), next.getMonth(), day), 'yyyy-MM-dd')
}

export function AddExpenseDialog({
  open,
  onClose,
  propertyId,
  propertyName,
  propertyOptions,
  onPropertyChange,
  defaultExpenseDate,
  onAdded,
}: AddExpenseDialogProps) {
  const api = useApi()
  const {
    selectedMonth,
    from: monthFrom,
    to: monthTo,
    label: selectedMonthLabel,
  } = useSelectedMonth()
  const recurringId = useId()
  const viewingPastMonth = selectedMonth !== currentMonthValue()

  const [category, setCategory] = useState('')
  const defaultInMonth = useMemo(() => {
    if (defaultExpenseDate && defaultExpenseDate >= monthFrom && defaultExpenseDate <= monthTo) {
      return defaultExpenseDate
    }
    const today = format(new Date(), 'yyyy-MM-dd')
    if (today >= monthFrom && today <= monthTo) return today
    return monthFrom
  }, [defaultExpenseDate, monthFrom, monthTo])

  const [expenseDate, setExpenseDate] = useState(defaultInMonth)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!open) return
    setCategory('')
    setExpenseDate(defaultInMonth)
    setAmount('')
    setDescription('')
    setRecurring(false)
    setFormError('')
  }, [open, defaultInMonth])

  const createExpenseMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = Math.round(parseMoneyInput(amount))
      if (!category) throw new Error('Select a category')
      if (!expenseDate) throw new Error('Select a date')
      if (expenseDate < monthFrom || expenseDate > monthTo) {
        throw new Error(`Expense date must fall within ${selectedMonthLabel}`)
      }
      if (!parsedAmount || parsedAmount <= 0) throw new Error('Enter a valid amount')

      const note = description.trim()
      const fullDescription = recurring
        ? note
          ? `[Recurring] ${note}`
          : '[Recurring]'
        : note || undefined

      const payload = {
        propertyId,
        category,
        amount: parsedAmount,
        description: fullDescription,
      }

      await api('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          expenseDate,
        }),
      })

      // Backfilling a past month: also create the same recurring expense for next month.
      if (recurring && viewingPastMonth) {
        await api('/expenses', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            expenseDate: sameDayNextMonth(expenseDate),
          }),
        })
      }
    },
    onSuccess: () => {
      onAdded?.()
      onClose()
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Failed to add expense')
    },
  })

  function handleSubmit() {
    setFormError('')
    if (expenseDate && (expenseDate < monthFrom || expenseDate > monthTo)) {
      setFormError(`Expense date must fall within ${selectedMonthLabel}.`)
      return
    }
    createExpenseMutation.mutate()
  }

  const recurringHint =
    recurring && viewingPastMonth
      ? 'Also creates this expense for the next month'
      : 'Automatically record every month'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add New Expense"
      description={`Record an expense for ${selectedMonthLabel}.`}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-5 border-t border-border pt-5">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Property</FieldLabel>
          <Select
            value={propertyId}
            disabled={!propertyOptions?.length || !onPropertyChange}
            options={
              propertyOptions?.length
                ? propertyOptions.map((property) => ({
                    label: property.name,
                    value: property.id,
                  }))
                : [{ label: propertyName, value: propertyId }]
            }
            onChange={(event) => onPropertyChange?.(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Category</FieldLabel>
            <div className="relative">
              <Select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                options={EXPENSE_CATEGORIES.map((item) => ({
                  label: item,
                  value: item,
                }))}
                placeholder="Select category"
                className="pr-10"
              />
              <Shapes
                className="pointer-events-none absolute right-9 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Date</FieldLabel>
            <Input
              type="date"
              value={expenseDate}
              min={monthFrom}
              max={monthTo}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Amount</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₦
            </span>
            <MoneyInput
              placeholder="0"
              value={amount}
              onValueChange={setAmount}
              className="pl-8"
            />
          </div>
          <Typography variant="caption" className="italic text-muted-foreground">
            Enter the total amount including VAT where applicable.
          </Typography>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary">
              <RefreshCw className="size-5" aria-hidden />
            </div>
            <div>
              <Typography variant="label">Recurring Expense</Typography>
              <Typography variant="caption" className="block text-muted-foreground">
                {recurringHint}
              </Typography>
            </div>
          </div>
          <ToggleSwitch
            id={recurringId}
            checked={recurring}
            onChange={setRecurring}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Description (Optional)</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any details about the expense..."
            rows={3}
            className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

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
            loading={createExpenseMutation.isPending}
            onClick={handleSubmit}
          >
            Add Expense
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
