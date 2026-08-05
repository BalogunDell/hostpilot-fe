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

export function WhatsAppSettingsSection() {
  const api = useApi()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { hasWhatsApp, plan } = usePlanFeatures()
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState('')

  const { data: status, isLoading } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => api<WhatsAppStatus>('/whatsapp/status'),
    enabled: Boolean(user) && hasWhatsApp,
  })

  const linkMutation = useMutation({
    mutationFn: (phoneNumber: string) =>
      api<WhatsAppStatus>('/whatsapp/link', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }),
    onSuccess: (result) => {
      setFormError('')
      queryClient.setQueryData(['whatsapp', 'status'], result)
      void queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] })
      setPhone('')
      showToast('WhatsApp Business number connected')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to connect WhatsApp number'
      setFormError(message)
    },
  })

  function handleConnect() {
    if (!hasWhatsApp) return
    if (!phone.trim()) {
      setFormError('Enter your WhatsApp Business phone number')
      return
    }
    setFormError('')
    linkMutation.mutate(phone.trim())
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div>
        <Typography variant="h4">WhatsApp</Typography>
        <Typography variant="body" className="mt-1 text-muted-foreground">
          {WHATSAPP_FEATURE_DESCRIPTION}
        </Typography>
      </div>

      {!status?.phoneNumber ? <WhatsAppBusinessInfoBanner /> : null}

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
        ) : status?.phoneNumber ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Typography variant="label">{status.phoneNumber}</Typography>
            <Typography variant="caption" className="mt-1 block text-muted-foreground">
              WhatsApp Business connected
              {status.verifiedAt
                ? ` · connected ${new Date(status.verifiedAt).toLocaleDateString()}`
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
              Use the WhatsApp Business number you will message HostsLedger from.
            </Typography>
            {formError ? (
              <Typography variant="caption" className="text-destructive">
                {formError}
              </Typography>
            ) : null}
            <Button
              className="self-start"
              loading={linkMutation.isPending}
              disabled={!hasWhatsApp || !phone.trim()}
              onClick={handleConnect}
            >
              Connect WhatsApp
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
