import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Input,
  PlanUpgradeBanner,
  Select,
  Typography,
} from '../components'
import { cn } from '../lib/cn'
import {
  COHOST_PRIVILEGES,
  COHOST_PRIVILEGE_LABELS,
  formatCoHostPrivileges,
  hasAllCoHostPrivileges,
} from '@staypilot/shared'
import { ApiError } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePlanFeatures } from '../hooks/usePlanFeatures'

interface Property {
  id: string
  name: string
  location: string
}

interface CoHostMember {
  id: string
  email: string
  propertyId: string | null
  propertyName: string | null
  privileges: string[]
}

export function TeamSettingsPage({ embedded = false }: { embedded?: boolean }) {
  const api = useApi()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [privileges, setPrivileges] = useState<string[]>([...COHOST_PRIVILEGES])
  const allAccess = hasAllCoHostPrivileges(privileges)

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api<Property[]>('/properties'),
    enabled: Boolean(user),
  })

  const propertyOptions = useMemo(
    () => properties.map((property) => ({ label: property.name, value: property.id })),
    [properties],
  )

  useEffect(() => {
    if (!propertyId && properties.length > 0) {
      setPropertyId(properties[0].id)
    }
  }, [properties, propertyId])

  const { data } = useQuery({
    queryKey: ['cohosts'],
    queryFn: () => api<{ cohosts: CoHostMember[]; slotsUsed: number }>('/cohosts'),
    enabled: Boolean(user),
  })

  const { hasCoHosts: canUseCoHosts } = usePlanFeatures()

  const inviteMutation = useMutation({
    mutationFn: () =>
      api('/cohosts/invite', {
        method: 'POST',
        body: JSON.stringify({ email, propertyId, privileges }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohosts'] })
      setEmail('')
      showToast('Co-host invite sent')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to send invite'
      showToast(message, 'error')
    },
  })

  function toggleAllAccess(checked: boolean) {
    setPrivileges(checked ? [...COHOST_PRIVILEGES] : ['VIEW_DASHBOARD'])
  }

  function togglePrivilege(privilege: string, checked: boolean) {
    setPrivileges((current) => {
      const next = checked
        ? [...current, privilege]
        : current.filter((item) => item !== privilege)
      return next.length > 0 ? next : current
    })
  }

  function handleSendInvite() {
    if (user?.email && email.trim().toLowerCase() === user.email.toLowerCase()) {
      showToast('You cannot invite your own email as a co-host', 'error')
      return
    }
    inviteMutation.mutate()
  }

  const ownerEmail = user?.email?.toLowerCase()
  const invitingSelf = Boolean(ownerEmail) && email.trim().toLowerCase() === ownerEmail

  return (
    <div className={cn('flex flex-col gap-6', !embedded && 'max-w-2xl')}>
      {!embedded ? <Typography variant="h2">Co-hosts</Typography> : null}

      {!canUseCoHosts ? (
        <PlanUpgradeBanner requiredPlan="PRO" feature="Co-host access" />
      ) : null}

      <Card padding="md">
        <Typography variant="h4" className="mb-4">Invite co-host</Typography>
        <div className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Select
            label="Property"
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            options={propertyOptions}
            placeholder="Select a property"
            disabled={propertyOptions.length === 0}
          />
          <div className="flex flex-col gap-2">
            <Typography variant="label">Access</Typography>
            <Checkbox
              label="All access"
              checked={allAccess}
              onChange={(event) => toggleAllAccess(event.target.checked)}
            />
            {COHOST_PRIVILEGES.map((privilege) => (
              <Checkbox
                key={privilege}
                label={COHOST_PRIVILEGE_LABELS[privilege]}
                checked={privileges.includes(privilege)}
                disabled={allAccess}
                onChange={(event) => togglePrivilege(privilege, event.target.checked)}
              />
            ))}
          </div>
        </div>
        {invitingSelf ? (
          <Typography variant="caption" className="mt-4 block text-destructive">
            You cannot invite your own email as a co-host.
          </Typography>
        ) : null}
        {!canUseCoHosts ? (
          <Typography variant="caption" className="mt-4 block text-destructive">
            Upgrade to Pro to invite co-hosts.
          </Typography>
        ) : null}
        <Button
          className="mt-4"
          onClick={handleSendInvite}
          loading={inviteMutation.isPending}
          disabled={
            !email || !propertyId || privileges.length === 0 || !canUseCoHosts || invitingSelf
          }
        >
          Send invite
        </Button>
      </Card>
      <Card padding="md">
        <Typography variant="h4" className="mb-4">Active co-hosts</Typography>
        {(data?.cohosts ?? []).length === 0 ? (
          <Typography variant="body">No active co-hosts yet.</Typography>
        ) : (
          (data?.cohosts ?? []).map((cohost) => (
            <div key={cohost.id} className="border-b border-border py-3 last:border-b-0">
              <Typography variant="label">{cohost.email}</Typography>
              {cohost.propertyName ? (
                <Typography variant="caption" className="mt-1 block">
                  Property: {cohost.propertyName}
                </Typography>
              ) : null}
              <Typography variant="caption" className="mt-1 block">
                {formatCoHostPrivileges(cohost.privileges)}
              </Typography>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
