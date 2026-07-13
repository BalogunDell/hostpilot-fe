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
  const { hasWhatsApp } = usePlanFeatures()
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState('')

  const { data: status, isLoading } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => api<WhatsAppStatus>('/whatsapp/status'),
    enabled: Boolean(user) && hasWhatsApp,
  })

  const linkMutation = useMutation({
    mutationFn: () =>
      api<WhatsAppStatus>('/whatsapp/link', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phone }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] })
      setPhone('')
      setFormError('')
      showToast('WhatsApp Business number linked')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to link WhatsApp'
      setFormError(message)
    },
  })

  function handleLink() {
    if (!hasWhatsApp) return
    if (!phone.trim()) {
      setFormError('Enter your WhatsApp Business phone number')
      return
    }
    setFormError('')
    linkMutation.mutate()
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div>
        <Typography variant="h4">WhatsApp</Typography>
        <Typography variant="body" className="mt-1 text-muted-foreground">
          {WHATSAPP_FEATURE_DESCRIPTION}
        </Typography>
      </div>

      <WhatsAppBusinessInfoBanner />

      {!hasWhatsApp ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
          <Typography variant="body" className="text-muted-foreground">
            WhatsApp is available on the Growth plan and above.{' '}
            <AppLink to="/settings#pricing" className="font-medium text-secondary hover:underline">
              Upgrade to Growth
            </AppLink>{' '}
            to connect your WhatsApp Business number.
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
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label={WHATSAPP_BUSINESS_PHONE_LABEL}
              placeholder="+234..."
              value={phone}
              disabled={!hasWhatsApp}
              onChange={(event) => setPhone(event.target.value)}
            />
            {formError ? (
              <Typography variant="caption" className="text-destructive">
                {formError}
              </Typography>
            ) : null}
            <Button
              className="self-start"
              loading={linkMutation.isPending}
              disabled={!hasWhatsApp || !phone.trim()}
              onClick={handleLink}
            >
              Connect WhatsApp Business
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
