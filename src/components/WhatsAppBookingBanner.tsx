import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { Card, Typography, WhatsAppBusinessInfoBanner } from './index'
import { AppLink } from '../context/AppNavigation'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import {
  HOSTSLEDGER_WHATSAPP_NUMBER,
  HOSTSLEDGER_WHATSAPP_WA_LINK,
  WHATSAPP_FEATURE_DESCRIPTION,
} from '../lib/whatsappCopy'
import { cn } from '../lib/cn'

interface WhatsAppStatus {
  connected: boolean
  phoneNumber: string | null
  verifiedAt: string | null
}

export function WhatsAppBookingBanner() {
  const api = useApi()
  const { user } = useAuth()
  const { hasWhatsApp } = usePlanFeatures()

  const { data: status, isLoading } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => api<WhatsAppStatus>('/whatsapp/status'),
    enabled: Boolean(user) && hasWhatsApp,
  })

  const isConnected = Boolean(status?.connected && status.phoneNumber)

  return (
    <Card
      padding="md"
      className={cn(
        'border-secondary-100 bg-secondary-50 dark:bg-secondary/10',
        !hasWhatsApp && 'opacity-90',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-foreground',
            !hasWhatsApp && 'opacity-60',
          )}
        >
          <MessageCircle className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-3">
          <Typography variant="label">Add bookings through WhatsApp</Typography>

          {!hasWhatsApp ? (
            <>
              <WhatsAppBusinessInfoBanner />
              <Typography variant="body" className="text-muted-foreground">
                {WHATSAPP_FEATURE_DESCRIPTION} Upgrade to Growth to connect WhatsApp and log
                bookings by message.
              </Typography>
              <AppLink
                to="/settings#pricing"
                className="inline-flex text-sm font-medium text-secondary hover:underline"
              >
                Upgrade to Growth
              </AppLink>
            </>
          ) : isLoading ? (
            <Typography variant="caption" className="text-muted-foreground">
              Checking WhatsApp connection…
            </Typography>
          ) : isConnected ? (
            <Typography variant="body" className="text-muted-foreground">
              Linked as{' '}
              <span className="font-medium text-foreground">{status!.phoneNumber}</span>. Message{' '}
              <a
                href={HOSTSLEDGER_WHATSAPP_WA_LINK}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-secondary hover:underline"
              >
                {HOSTSLEDGER_WHATSAPP_NUMBER}
              </a>{' '}
              with Hi or Menu to get started.
            </Typography>
          ) : (
            <>
              <WhatsAppBusinessInfoBanner />
              <Typography variant="body" className="text-muted-foreground">
                Connect your WhatsApp Business number to log bookings by message instead of
                adding them manually.
              </Typography>
              <AppLink
                to="/settings#whatsapp"
                className="inline-flex text-sm font-medium text-secondary hover:underline"
              >
                Connect WhatsApp in Settings
              </AppLink>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
