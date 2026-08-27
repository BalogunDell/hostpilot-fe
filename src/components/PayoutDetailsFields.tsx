import { useQuery } from '@tanstack/react-query'
import { Input, Select, Typography } from './index'
import { useApi } from '../hooks/useApi'

export interface PayoutStatus {
  connected: boolean
  hasSavedAccount?: boolean
  businessName?: string
  bankName?: string | null
  accountName?: string | null
  accountNumberLast4?: string
}

export interface PayoutFormValues {
  businessName: string
  bankCode: string
  accountNumber: string
}

interface BankOption {
  name: string
  code: string
}

interface PayoutDetailsFieldsProps {
  open: boolean
  values: PayoutFormValues
  onChange: (next: PayoutFormValues) => void
  disabled?: boolean
}

export function usePayoutStatus(enabled: boolean) {
  const api = useApi()
  return useQuery({
    queryKey: ['payouts', 'status'],
    queryFn: () => api<PayoutStatus>('/payouts/status'),
    enabled,
  })
}

export function PayoutDetailsFields({
  open,
  values,
  onChange,
  disabled = false,
}: PayoutDetailsFieldsProps) {
  const api = useApi()
  const statusQuery = usePayoutStatus(open)
  const banksQuery = useQuery({
    queryKey: ['payouts', 'banks'],
    queryFn: () => api<{ banks: BankOption[] }>('/payouts/banks'),
    enabled: open,
    staleTime: 60 * 60 * 1000,
  })

  const status = statusQuery.data
  const hasSaved = Boolean(status?.hasSavedAccount || status?.connected)
  const banks = banksQuery.data?.banks ?? []

  if (statusQuery.isLoading) {
    return (
      <Typography variant="caption" className="text-muted-foreground">
        Checking payout account…
      </Typography>
    )
  }

  if (hasSaved) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-3">
        <Typography variant="label" className="mb-1 block">
          Guest payments settle to
        </Typography>
        <Typography variant="body">
          {status?.accountName ?? status?.businessName}
          {status?.bankName ? ` · ${status.bankName}` : ''}
          {status?.accountNumberLast4 ? ` · ****${status.accountNumberLast4}` : ''}
        </Typography>
        <Typography variant="caption" className="mt-1 block text-muted-foreground">
          Saved from your Paystack payout account. You can update it in Settings anytime.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-3">
      <Typography variant="label">Where should guest payments go?</Typography>
      <Typography variant="caption" className="text-muted-foreground">
        Enter the Nigerian bank account that should receive stay payments. We verify it with
        Paystack and only store the last 4 digits.
      </Typography>
      <Input
        label="Account / business name"
        value={values.businessName}
        disabled={disabled}
        onChange={(event) => onChange({ ...values, businessName: event.target.value })}
        placeholder="As it appears on your bank account"
      />
      <Select
        label="Bank"
        value={values.bankCode}
        disabled={disabled}
        onChange={(event) => onChange({ ...values, bankCode: event.target.value })}
        placeholder={banksQuery.isLoading ? 'Loading banks…' : 'Select bank'}
        options={banks.map((bank) => ({ label: bank.name, value: bank.code }))}
      />
      <Input
        label="Account number"
        value={values.accountNumber}
        disabled={disabled}
        onChange={(event) =>
          onChange({
            ...values,
            accountNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
          })
        }
        placeholder="10 digits"
        inputMode="numeric"
      />
    </div>
  )
}

export function payoutPayloadOrUndefined(
  status: PayoutStatus | undefined,
  values: PayoutFormValues,
): PayoutFormValues | undefined {
  if (status?.hasSavedAccount || status?.connected) return undefined
  return values
}

export function validatePayoutForm(
  status: PayoutStatus | undefined,
  values: PayoutFormValues,
): string | null {
  if (status?.hasSavedAccount || status?.connected) return null
  if (values.businessName.trim().length < 2) {
    return 'Enter the account / business name as it appears at your bank.'
  }
  if (!values.bankCode) return 'Select your bank.'
  if (!/^\d{10}$/.test(values.accountNumber.trim())) {
    return 'Enter a valid 10-digit account number.'
  }
  return null
}
