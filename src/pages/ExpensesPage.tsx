import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  AddExpenseDialog,
  Button,
  Card,
  Input,
  Select,
  Typography,
} from '../components'
import { apiRequestPaginated, formatNaira } from '../api/client'
import { useActionsDisabled } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useSelectedProperty } from '../context/SelectedPropertyContext'
import { useSelectedMonth } from '../hooks/useSelectedMonth'
import { useApi } from '../hooks/useApi'
import { EXPENSE_CATEGORIES } from '../lib/propertyMetrics'

interface Expense {
  id: string
  propertyId: string
  category: string
  description: string | null
  amount: number
  expenseDate: string
}

const expenseFieldClassName =
  'h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'

export function ExpensesPage() {
  const api = useApi()
  const { token } = useAuth()
  const actionsDisabled = useActionsDisabled()
  const queryClient = useQueryClient()
  const {
    selectedProperty,
    selectedPropertyId,
    setSelectedPropertyId,
    properties,
  } = useSelectedProperty()
  const { from: monthFrom, to: monthTo, label: selectedMonthLabel } = useSelectedMonth()
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)

  const expensesQuery = useQuery({
    queryKey: ['expenses', selectedPropertyId, monthFrom, monthTo],
    queryFn: () =>
      apiRequestPaginated<Expense>(
        `/expenses?propertyId=${selectedPropertyId}&from=${monthFrom}&to=${monthTo}&limit=100`,
        { token },
      ),
    enabled: Boolean(token && selectedPropertyId),
  })

  const expenses = expensesQuery.data?.data ?? []
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  function invalidateExpenses() {
    void queryClient.invalidateQueries({ queryKey: ['expenses', selectedPropertyId] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const updateExpenseMutation = useMutation({
    mutationFn: ({
      expenseId,
      category,
      amount,
    }: {
      expenseId: string
      category: string
      amount: number
    }) =>
      api(`/expenses/${expenseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ category, amount }),
      }),
    onSuccess: invalidateExpenses,
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) =>
      api(`/expenses/${expenseId}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidateExpenses,
  })

  if (!selectedPropertyId || !selectedProperty) {
    return (
      <div className="flex flex-col gap-3">
        <Typography variant="h2">Expenses</Typography>
        <Typography variant="body" className="text-muted-foreground">
          Select a property from the top bar to view expenses.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography variant="h2">Expenses</Typography>
          <Typography variant="caption" className="mt-1 block">
            {selectedProperty.name} · {selectedMonthLabel}
          </Typography>
        </div>
        <Button disabled={actionsDisabled} onClick={() => setAddExpenseOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Add expense
        </Button>
      </div>

      <Card padding="md" className="flex flex-col gap-5">
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]">
            <Typography
              variant="caption"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              Category
            </Typography>
            <Typography
              variant="caption"
              className="hidden text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:block"
            >
              Date
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              Amount
            </Typography>
            <span aria-hidden />
          </div>

          {expensesQuery.isLoading ? (
            <div className="px-4 py-6">
              <Typography variant="caption">Loading expenses…</Typography>
            </div>
          ) : expenses.length === 0 ? (
            <div className="px-4 py-6">
              <Typography variant="caption">
                No expenses recorded for {selectedMonthLabel}.
              </Typography>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]"
              >
                <Select
                  value={expense.category}
                  className={expenseFieldClassName}
                  disabled={actionsDisabled}
                  options={EXPENSE_CATEGORIES.map((category) => ({
                    label: category,
                    value: category,
                  }))}
                  onChange={(event) =>
                    updateExpenseMutation.mutate({
                      expenseId: expense.id,
                      category: event.target.value,
                      amount: expense.amount,
                    })
                  }
                />
                <Typography variant="caption" className="hidden text-muted-foreground sm:block">
                  {format(parseISO(expense.expenseDate), 'MMM d, yyyy')}
                </Typography>
                <Input
                  type="number"
                  className={expenseFieldClassName}
                  disabled={actionsDisabled}
                  defaultValue={String(expense.amount)}
                  onBlur={(event) => {
                    const amount = Number(event.target.value)
                    if (!Number.isFinite(amount) || amount === expense.amount) return
                    updateExpenseMutation.mutate({
                      expenseId: expense.id,
                      category: expense.category,
                      amount,
                    })
                  }}
                />
                <button
                  type="button"
                  disabled={actionsDisabled}
                  className="inline-flex size-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive-50 disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Delete expense"
                  onClick={() => deleteExpenseMutation.mutate(expense.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border bg-muted/10 px-4 py-3">
            <Typography variant="label">Total</Typography>
            <Typography variant="h4" className="text-right text-lg font-bold text-destructive">
              {formatNaira(total)}
            </Typography>
          </div>
        </div>
      </Card>

      <AddExpenseDialog
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        propertyId={selectedProperty.id}
        propertyName={selectedProperty.name}
        propertyOptions={properties}
        onPropertyChange={setSelectedPropertyId}
        onAdded={invalidateExpenses}
      />
    </div>
  )
}
