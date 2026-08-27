import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Input, Select, Typography } from './index'
import { ApiError } from '../api/client'
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
  /** Set after Paystack bank resolve succeeds for the current bank + account. */
  resolvedAccountName: string | null
}

interface BankOption {
  name: string
  code: string
}

interface ResolvedAccount {
  accountNumber: string
  accountName: string
  bankCode: string
  bankName: string
}

interface PayoutDetailsFieldsProps {
  open: boolean
  values: PayoutFormValues
  onChange: (next: PayoutFormValues) => void
  disabled?: boolean
}

export function emptyPayoutForm(): PayoutFormValues {
  return {
    businessName: '',
    bankCode: '',
    accountNumber: '',
    resolvedAccountName: null,
  }
}

export function usePayoutStatus(enabled: boolean) {
  const api = useApi()
  return useQuery({
    queryKey: ['payouts', 'status'],
    queryFn: () => api<PayoutStatus>('/payouts/status'),
    enabled,
  })
}

export function usePaystackAccountResolve(input: {
  enabled: boolean
  bankCode: string
  accountNumber: string
  onResolved: (accountName: string) => void
  onCleared: () => void
}) {
  const api = useApi()
  const [error, setError] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const requestIdRef = useRef(0)
  const onResolvedRef = useRef(input.onResolved)
  const onClearedRef = useRef(input.onCleared)
  onResolvedRef.current = input.onResolved
  onClearedRef.current = input.onCleared

  const ready =
    input.enabled && Boolean(input.bankCode) && /^\d{10}$/.test(input.accountNumber.trim())

  useEffect(() => {
    if (!ready) {
      setError('')
      setIsResolving(false)
      onClearedRef.current()
      return
    }

    const bankCode = input.bankCode
    const accountNumber = input.accountNumber.trim()
    const requestId = ++requestIdRef.current
    setIsResolving(true)
    setError('')
    onClearedRef.current()

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const qs = new URLSearchParams({ bankCode, accountNumber })
          const resolved = await api<ResolvedAccount>(`/payouts/resolve-account?${qs}`)
          if (requestId !== requestIdRef.current) return
          onResolvedRef.current(resolved.accountName)
          setError('')
        } catch (err) {
          if (requestId !== requestIdRef.current) return
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Could not verify this account with Paystack',
          )
          onClearedRef.current()
        } finally {
          if (requestId === requestIdRef.current) setIsResolving(false)
        }
      })()
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [api, ready, input.bankCode, input.accountNumber])

  return { ready, isResolving, error }
}

export function PayoutDetailsFields({
  open,
  values,
  onChange,
  disabled = false,
}: PayoutDetailsFieldsProps) {
  const api = useApi()
  const valuesRef = useRef(values)
  valuesRef.current = values

  const statusQuery = usePayoutStatus(open)
  const banksQuery = useQuery({
    queryKey: ['payouts', 'banks'],
    queryFn: () => api<{ banks: BankOption[] }>('/payouts/banks'),
    enabled: open,
    staleTime: 60 * 60 * 1000,
  })

  const resolve = usePaystackAccountResolve({
    enabled: open && !disabled,
    bankCode: values.bankCode,
    accountNumber: values.accountNumber,
    onResolved: (accountName) => {
      const current = valuesRef.current
      onChange({
        ...current,
        resolvedAccountName: accountName,
        businessName: current.businessName.trim() ? current.businessName : accountName,
      })
    },
    onCleared: () => {
      const current = valuesRef.current
      if (current.resolvedAccountName !== null) {
        onChange({ ...current, resolvedAccountName: null })
      }
    },
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
    const last4 = status?.accountNumberLast4 ? `····${status.accountNumberLast4}` : null
    const label =
      [status?.accountName ?? status?.businessName, last4].filter(Boolean).join(' · ') ||
      'Saved payout account'
    return (
      <Typography variant="caption" className="text-muted-foreground">
        Settles to {label}
      </Typography>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-3">
      <Typography variant="label">Where should guest payments go?</Typography>
      <Typography variant="caption" className="text-muted-foreground">
        Enter a Nigerian bank account — we verify it with Paystack and don’t store the number.
      </Typography>
      <Select
        label="Bank"
        value={values.bankCode}
        disabled={disabled}
        onChange={(event) =>
          onChange({
            ...values,
            bankCode: event.target.value,
            resolvedAccountName: null,
          })
        }
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
            resolvedAccountName: null,
          })
        }
        placeholder="10 digits"
        inputMode="numeric"
      />
      {resolve.isResolving ? (
        <Typography variant="caption" className="text-muted-foreground">
          Verifying account with Paystack…
        </Typography>
      ) : resolve.error ? (
        <Typography variant="caption" className="text-destructive">
          {resolve.error}
        </Typography>
      ) : values.resolvedAccountName ? (
        <Typography variant="caption" className="text-muted-foreground">
          Verified: {values.resolvedAccountName}
        </Typography>
      ) : (
        <Typography variant="caption" className="text-muted-foreground">
          Select a bank and enter 10 digits to verify.
        </Typography>
      )}
      <Input
        label="Account / business name"
        value={values.businessName}
        disabled={disabled}
        onChange={(event) => onChange({ ...values, businessName: event.target.value })}
        placeholder="As it appears on your bank account"
      />
    </div>
  )
}

export function payoutPayloadOrUndefined(
  status: PayoutStatus | undefined,
  values: PayoutFormValues,
): Pick<PayoutFormValues, 'businessName' | 'bankCode' | 'accountNumber'> | undefined {
  if (status?.hasSavedAccount || status?.connected) return undefined
  return {
    businessName: values.businessName,
    bankCode: values.bankCode,
    accountNumber: values.accountNumber,
  }
}

export function validatePayoutForm(
  status: PayoutStatus | undefined,
  values: PayoutFormValues,
): string | null {
  if (status?.hasSavedAccount || status?.connected) return null
  if (!values.bankCode) return 'Select your bank.'
  if (!/^\d{10}$/.test(values.accountNumber.trim())) {
    return 'Enter a valid 10-digit account number.'
  }
  if (!values.resolvedAccountName) {
    return 'Wait for Paystack to verify the account number.'
  }
  if (values.businessName.trim().length < 2) {
    return 'Enter the account / business name as it appears at your bank.'
  }
  return null
}
