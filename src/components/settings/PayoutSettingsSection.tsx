import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  BOOKING_PAYMENT_HOLD_HOURS,
  BOOKING_PLATFORM_FEE_MIN_NGN,
  BOOKING_PLATFORM_FEE_PERCENT,
} from '@staypilot/shared'
import { Button, Card, Input, Select, Typography } from '../index'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'

interface PayoutStatus {
  connected: boolean
  businessName?: string
  bankName?: string | null
  accountName?: string | null
  accountNumberLast4?: string
  updatedAt?: string
}

interface BankOption {
  name: string
  code: string
}

export function PayoutSettingsSection() {
  const api = useApi()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [businessName, setBusinessName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [formError, setFormError] = useState('')

  const statusQuery = useQuery({
    queryKey: ['payouts', 'status'],
    queryFn: () => api<PayoutStatus>('/payouts/status'),
    enabled: Boolean(user),
  })

  const banksQuery = useQuery({
    queryKey: ['payouts', 'banks'],
    queryFn: () => api<{ banks: BankOption[] }>('/payouts/banks'),
    enabled: Boolean(user),
    staleTime: 60 * 60 * 1000,
  })

  const connectMutation = useMutation({
    mutationFn: () =>
      api<PayoutStatus>('/payouts/connect', {
        method: 'POST',
        body: JSON.stringify({
          businessName: businessName.trim(),
          bankCode,
          accountNumber: accountNumber.trim(),
        }),
      }),
    onSuccess: (result) => {
      setFormError('')
      queryClient.setQueryData(['payouts', 'status'], result)
      setAccountNumber('')
      showToast('Payout account connected')
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not connect payout account',
      )
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: () =>
      api<PayoutStatus>('/payouts/connect', {
        method: 'DELETE',
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(['payouts', 'status'], result)
      showToast('Payout account disconnected')
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : 'Could not disconnect payout account',
        'error',
      )
    },
  })

  const status = statusQuery.data
  const banks = banksQuery.data?.banks ?? []

  function handleConnect() {
    if (businessName.trim().length < 2) {
      setFormError('Enter the account / business name as it appears at your bank.')
      return
    }
    if (!bankCode) {
      setFormError('Select your bank.')
      return
    }
    if (!/^\d{10}$/.test(accountNumber.trim())) {
      setFormError('Enter a valid 10-digit account number.')
      return
    }
    setFormError('')
    connectMutation.mutate()
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div>
        <Typography variant="h4">Receive guest payments</Typography>
        <Typography variant="body" className="mt-1 text-muted-foreground">
          Connect a Nigerian bank account so guests can pay bookings online. Money settles to your
          bank via Paystack. HostsLedger only stores a Paystack payout code — not your full account
          number — and takes a {BOOKING_PLATFORM_FEE_PERCENT}% guest service fee (min ₦
          {BOOKING_PLATFORM_FEE_MIN_NGN.toLocaleString()}). Pay links expire after{' '}
          {BOOKING_PAYMENT_HOLD_HOURS} hours.
        </Typography>
      </div>

      {statusQuery.isLoading ? (
        <Typography variant="caption">Loading payout status…</Typography>
      ) : status?.connected ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
          <Typography variant="label">Connected</Typography>
          <Typography variant="body">
            {status.accountName ?? status.businessName}
            {status.bankName ? ` · ${status.bankName}` : ''}
            {status.accountNumberLast4 ? ` · ****${status.accountNumberLast4}` : ''}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Refunds are manual for now — coordinate with support if a guest needs one. Failed or
            abandoned payments leave the booking unpaid until the guest retries or you create a new
            link.
          </Typography>
          <div>
            <Button
              variant="outlined"
              size="sm"
              loading={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Input
            label="Account / business name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="As it appears on your bank account"
          />
          <Select
            label="Bank"
            value={bankCode}
            onChange={(event) => setBankCode(event.target.value)}
            placeholder="Select bank"
            options={banks.map((bank) => ({ label: bank.name, value: bank.code }))}
          />
          <Input
            label="Account number"
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10 digits"
            inputMode="numeric"
          />
          {formError ? (
            <Typography variant="caption" className="text-destructive">
              {formError}
            </Typography>
          ) : (
            <Typography variant="caption" className="text-muted-foreground">
              We verify the account name with Paystack, then create a payout subaccount. Your full
              account number is not stored in HostsLedger.
            </Typography>
          )}
          <Button loading={connectMutation.isPending} onClick={handleConnect}>
            Connect payout account
          </Button>
        </div>
      )}
    </Card>
  )
}
