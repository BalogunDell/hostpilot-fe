import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  CALENDAR_SYNC_PLATFORM_LABELS,
  type CalendarSyncPlatform,
} from '@staypilot/shared'
import { Button } from './Button'
import { CalendarPlatformHelp } from './CalendarPlatformHelp'
import { Dialog } from './Dialog'
import { Input } from './Input'
import { Select } from './Select'
import { Typography } from './Typography'
import { PlanUpgradeBanner } from './PlanUpgradeBanner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'

interface Property {
  id: string
  name: string
}

interface ConnectCalendarDialogProps {
  open: boolean
  onClose: () => void
  onConnected?: () => void
  initialPropertyId?: string
}

export function ConnectCalendarDialog({
  open,
  onClose,
  onConnected,
  initialPropertyId,
}: ConnectCalendarDialogProps) {
  const api = useApi()
  const { token } = useAuth()
  const { hasCalendarSync } = usePlanFeatures()
  const { showToast } = useToast()

  const [propertyId, setPropertyId] = useState('')
  const [platform, setPlatform] = useState<CalendarSyncPlatform>('AIRBNB')
  const [icalUrl, setIcalUrl] = useState('')
  const [formError, setFormError] = useState('')

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api<Property[]>('/properties'),
    enabled: Boolean(token) && open,
  })

  useEffect(() => {
    if (!open) return
    setPlatform('AIRBNB')
    setIcalUrl('')
    setFormError('')
  }, [open])

  useEffect(() => {
    if (!open || properties.length === 0) {
      setPropertyId('')
      return
    }

    const preferredId =
      initialPropertyId && properties.some((property) => property.id === initialPropertyId)
        ? initialPropertyId
        : properties[0]!.id

    setPropertyId(preferredId)
  }, [open, properties, initialPropertyId])

  const connectMutation = useMutation({
    mutationFn: () => {
      const trimmedUrl = icalUrl.trim()
      if (!propertyId) throw new Error('Select a property')
      if (!trimmedUrl) throw new Error('Enter an iCal URL')

      return api<{ sync: { propertyId: string } }>(
        `/properties/${propertyId}/calendar-sync`,
        {
          method: 'POST',
          body: JSON.stringify({ platform, icalUrl: trimmedUrl }),
        },
      )
    },
    onSuccess: () => {
      showToast('Calendar connected and synced.')
      onConnected?.()
      onClose()
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Failed to connect calendar')
    },
  })

  function handleSubmit() {
    setFormError('')
    connectMutation.mutate()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Connect calendar"
      description="Import bookings from Airbnb or Bookings.com into StayPilot."
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4 border-t border-border pt-5">
        {!hasCalendarSync ? (
          <PlanUpgradeBanner
            requiredPlan="GROWTH"
            feature="Calendar sync"
            className="border-0 bg-transparent p-0 shadow-none"
          />
        ) : propertiesLoading ? (
          <Typography variant="caption" className="text-muted-foreground">
            Loading properties…
          </Typography>
        ) : properties.length === 0 ? (
          <Typography variant="caption" className="text-muted-foreground">
            Add a property first, then connect its calendar here.
          </Typography>
        ) : (
          <>
            <Select
              label="Property"
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
              options={properties.map((property) => ({
                label: property.name,
                value: property.id,
              }))}
            />
            <Select
              label="Calendar platform"
              value={platform}
              onChange={(event) =>
                setPlatform(event.target.value as CalendarSyncPlatform)
              }
              options={[
                { label: CALENDAR_SYNC_PLATFORM_LABELS.AIRBNB, value: 'AIRBNB' },
                { label: CALENDAR_SYNC_PLATFORM_LABELS.BOOKING, value: 'BOOKING' },
              ]}
            />
            <CalendarPlatformHelp platform={platform} />
            <Input
              label={`${CALENDAR_SYNC_PLATFORM_LABELS[platform]} iCal URL`}
              value={icalUrl}
              onChange={(event) => setIcalUrl(event.target.value)}
              placeholder="https://..."
            />
          </>
        )}

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
            loading={connectMutation.isPending}
            disabled={properties.length === 0 || !hasCalendarSync}
            onClick={handleSubmit}
          >
            Connect & sync
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
