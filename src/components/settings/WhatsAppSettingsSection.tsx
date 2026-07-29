import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Card, Input, Typography, WhatsAppBusinessInfoBanner } from '../index'
import { ApiError } from '../../api/client'
import { AppLink } from '../../context/AppNavigation'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { usePlanFeatures } from '../../hooks/usePlanFeatures'
import {
  HOSTSLEDGER_WHATSAPP_NUMBER,
  HOSTSLEDGER_WHATSAPP_WA_LINK,
  WHATSAPP_BUSINESS_PHONE_LABEL,
  WHATSAPP_FEATURE_DESCRIPTION,
} from '../../lib/whatsappCopy'
import { cn } from '../../lib/cn'

interface WhatsAppStatus {
  connected: boolean
  phoneNumber: string | null
  verifiedAt: string | null
}

interface RequestVerificationResult extends WhatsAppStatus {
  verificationSent?: boolean
  expiresInSeconds?: number
}

type Step = 'phone' | 'code'

export function WhatsAppSettingsSection() {
  const api = useApi()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { hasWhatsApp, plan } = usePlanFeatures()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<Step>('phone')
  const [pendingPhone, setPendingPhone] = useState('')
  const [formError, setFormError] = useState('')

  const { data: status, isLoading } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => api<WhatsAppStatus>('/whatsapp/status'),
    enabled: Boolean(user) && hasWhatsApp,
  })

  const requestMutation = useMutation({
    mutationFn: (phoneNumber: string) =>
      api<RequestVerificationResult>('/whatsapp/link/request', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }),
    onSuccess: (result, phoneNumber) => {
      setFormError('')
      if (result.connected) {
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] })
        setPhone('')
        setCode('')
        setStep('phone')
        showToast('WhatsApp Business number already connected')
        return
      }
      setPendingPhone(result.phoneNumber || phoneNumber)
      setStep('code')
      setCode('')
      showToast('Verification code sent to WhatsApp')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to send verification code'
      setFormError(message)
    },
  })

  const confirmMutation = useMutation({
    mutationFn: () =>
      api<WhatsAppStatus>('/whatsapp/link/confirm', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: pendingPhone, code }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] })
      setPhone('')
      setCode('')
      setPendingPhone('')
      setStep('phone')
      setFormError('')
      showToast('WhatsApp Business number verified and connected')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to verify code'
      setFormError(message)
    },
  })

  function handleRequestCode() {
    if (!hasWhatsApp) return
    if (!phone.trim()) {
      setFormError('Enter your WhatsApp Business phone number')
      return
    }
    setFormError('')
    requestMutation.mutate(phone.trim())
  }

  function handleConfirmCode() {
    if (!code.trim()) {
      setFormError('Enter the 6-digit code from WhatsApp')
      return
    }
    setFormError('')
    confirmMutation.mutate()
  }

  function handleChangeNumber() {
    setStep('phone')
    setCode('')
    setPendingPhone('')
    setFormError('')
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div>
        <Typography variant="h4">WhatsApp</Typography>
        <Typography variant="body" className="mt-1 text-muted-foreground">
          {WHATSAPP_FEATURE_DESCRIPTION}
        </Typography>
      </div>

      {!status?.connected ? <WhatsAppBusinessInfoBanner /> : null}

      {plan === 'STARTER' ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
          <Typography variant="body" className="text-muted-foreground">
            Your free plan includes 1 WhatsApp booking or expense log per month.{' '}
            <AppLink to="/settings#pricing" className="font-medium text-secondary hover:underline">
              Upgrade to Growth
            </AppLink>{' '}
            for unlimited WhatsApp logging and reports.
          </Typography>
        </div>
      ) : null}

      <div className={cn(!hasWhatsApp && 'pointer-events-none opacity-50')}>
        {isLoading ? (
          <Typography variant="caption" className="text-muted-foreground">
            Loading WhatsApp status…
          </Typography>
        ) : status?.connected && status.phoneNumber ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Typography variant="label">{status.phoneNumber}</Typography>
            <Typography variant="caption" className="mt-1 block text-muted-foreground">
              WhatsApp Business connected
              {status.verifiedAt
                ? ` · verified ${new Date(status.verifiedAt).toLocaleDateString()}`
                : ''}
            </Typography>
            <Typography variant="caption" className="mt-2 block text-muted-foreground">
              Message HostsLedger at{' '}
              <a
                href={HOSTSLEDGER_WHATSAPP_WA_LINK}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-secondary hover:underline"
              >
                {HOSTSLEDGER_WHATSAPP_NUMBER}
              </a>{' '}
              to add bookings and expenses.
            </Typography>
          </div>
        ) : step === 'code' ? (
          <div className="flex flex-col gap-4">
            <Typography variant="body" className="text-muted-foreground">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-foreground">{pendingPhone}</span> on WhatsApp.
              Enter it below to finish connecting.
            </Typography>
            <Input
              label="Verification code"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              disabled={!hasWhatsApp}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            {formError ? (
              <Typography variant="caption" className="text-destructive">
                {formError}
              </Typography>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                loading={confirmMutation.isPending}
                disabled={!hasWhatsApp || code.trim().length !== 6}
                onClick={handleConfirmCode}
              >
                Verify & connect
              </Button>
              <Button
                variant="secondary"
                loading={requestMutation.isPending}
                disabled={!hasWhatsApp}
                onClick={() => requestMutation.mutate(pendingPhone)}
              >
                Resend code
              </Button>
              <Button variant="ghost" disabled={confirmMutation.isPending} onClick={handleChangeNumber}>
                Change number
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label={`Optional: ${WHATSAPP_BUSINESS_PHONE_LABEL}`}
              placeholder="+234..."
              value={phone}
              disabled={!hasWhatsApp}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Typography variant="caption" className="text-muted-foreground">
              We’ll send a verification code to this WhatsApp number to confirm you own it.
            </Typography>
            {formError ? (
              <Typography variant="caption" className="text-destructive">
                {formError}
              </Typography>
            ) : null}
            <Button
              className="self-start"
              loading={requestMutation.isPending}
              disabled={!hasWhatsApp || !phone.trim()}
              onClick={handleRequestCode}
            >
              Send verification code
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
