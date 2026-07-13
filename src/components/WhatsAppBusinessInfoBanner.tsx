import { Info } from 'lucide-react'
import { Typography } from './Typography'
import { WHATSAPP_BUSINESS_PHONE_HELPER } from '../lib/whatsappCopy'
import { cn } from '../lib/cn'

interface WhatsAppBusinessInfoBannerProps {
  className?: string
}

export function WhatsAppBusinessInfoBanner({
  className,
}: WhatsAppBusinessInfoBannerProps) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 dark:border-secondary/30 dark:bg-secondary/10',
        className,
      )}
    >
      <Info
        className="mt-0.5 size-5 shrink-0 text-secondary"
        aria-hidden
      />
      <Typography
        variant="caption"
        className="leading-snug text-secondary-900 dark:text-secondary-foreground"
      >
        {WHATSAPP_BUSINESS_PHONE_HELPER}
      </Typography>
    </div>
  )
}
