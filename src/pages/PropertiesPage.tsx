import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BedDouble,
  Calendar,
  ClipboardList,
  MapPin,
  Plus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppLink, useGuardedNavigate } from '../context/AppNavigation'
import { useSearchParams } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  Dialog,
  Image,
  Input,
  PlanUpgradeBanner,
  PropertyCardsSkeleton,
  Typography,
} from '../components'
import { ApiError, formatNaira } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { cn } from '../lib/cn'
import { PROPERTY_FALLBACK_IMAGE } from '../lib/propertyImages'
import { getPropertyLimit, normalizeUserPlan, type UserPlan } from '@staypilot/shared'

interface Property {
  id: string
  name: string
  location: string
  nightlyRate: number | null
  imageUrls: string[]
  createdAt: string
}

interface PropertyPerformance {
  propertyId: string
  name: string
  location: string
  imageUrl: string | null
  revenue: number
  bookingCount: number
  occupancyRate: number
  monthlyMaintenance: number
  staffExpenses: number
}

function BreakdownLine({
  icon: Icon,
  label,
  value,
  valueClassName,
  iconClassName,
  href,
  linkLabel,
}: {
  icon: LucideIcon
  label: string
  value: string
  valueClassName?: string
  iconClassName?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={cn('size-4 shrink-0 text-muted-foreground', iconClassName)}
        aria-hidden
      />
      <Typography variant="body" className="text-sm">
        <span className="text-muted-foreground">{label}</span>
        {' - '}
        <span className={cn('font-medium', valueClassName)}>{value}</span>
        {href && linkLabel ? (
          <>
            {' - '}
            <AppLink to={href} className="font-medium text-secondary hover:underline">
              {linkLabel}
            </AppLink>
          </>
        ) : null}
      </Typography>
    </div>
  )
}

function nextPlanForMoreProperties(plan: UserPlan): UserPlan | null {
  if (plan === 'STARTER' || plan === 'FREE') return 'GROWTH'
  if (plan === 'GROWTH') return 'PRO'
  return null
}

function formatNairaCompact(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k`
  return formatNaira(amount)
}

export function PropertiesPage() {
  const api = useApi()
  const { user, token, featureFlags } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useGuardedNavigate()
  const [searchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('add') === '1')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [formError, setFormError] = useState('')

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api<Property[]>('/properties'),
    enabled: Boolean(token),
  })

  const { data: performance } = useQuery({
    queryKey: ['dashboard', 'properties'],
    queryFn: () =>
      api<{ properties: PropertyPerformance[] }>('/dashboard/properties'),
  })

  const properties = data ?? []
  const currentMonth = format(new Date(), 'MMMM')
  const propertyLimit = getPropertyLimit(user?.plan ?? 'STARTER')
  const currentPlan = normalizeUserPlan(user?.plan ?? 'STARTER')
  const upgradePlan = nextPlanForMoreProperties(currentPlan)
  const canAddProperty = properties.length < propertyLimit
  const addPropertyLimitMessage = `Your plan allows up to ${propertyLimit} ${propertyLimit === 1 ? 'property' : 'properties'}. Upgrade to add more.`

  useEffect(() => {
    if (searchParams.get('add') === '1' && canAddProperty) {
      setDialogOpen(true)
    }
  }, [canAddProperty, searchParams])

  const enrichedProperties = useMemo(() => {
    return properties
      .map((property) => {
        const perf = performance?.properties.find((p) => p.propertyId === property.id)
        const occupancyRate = perf?.occupancyRate ?? 0
        const revenue = perf?.revenue ?? 0
        const monthlyMaintenance = perf?.monthlyMaintenance ?? 0
        const staffExpenses = perf?.staffExpenses ?? 0
        const imageUrl = property.imageUrls[0] ?? perf?.imageUrl ?? null

        return {
          ...property,
          occupancyRate,
          revenue,
          monthlyMaintenance,
          staffExpenses,
          imageUrl,
        }
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }, [performance?.properties, properties])

  const topOccupancyProperty = useMemo(() => {
    if (enrichedProperties.length === 0) return null
    return enrichedProperties.reduce((best, property) =>
      property.occupancyRate > best.occupancyRate ? property : best,
    )
  }, [enrichedProperties])

  const createMutation = useMutation({
    mutationFn: () =>
      api<{ property: Property }>('/properties', {
        method: 'POST',
        body: JSON.stringify({ name, location }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'properties'] })
      setDialogOpen(false)
      setName('')
      setLocation('')
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'UPGRADE_REQUIRED') {
        showToast(addPropertyLimitMessage, 'error')
        setFormError('Upgrade to add more properties')
      } else {
        setFormError(err instanceof Error ? err.message : 'Failed')
      }
    },
  })

  function handleAddPropertyClick() {
    if (!canAddProperty) {
      showToast(addPropertyLimitMessage, 'error')
      return
    }
    setFormError('')
    setDialogOpen(true)
  }

  function renderAddPropertyButton(className?: string) {
    return (
      <Button className={className} onClick={handleAddPropertyClick}>
        <Plus className="size-4" aria-hidden />
        Add Property
      </Button>
    )
  }

  function renderAddPropertyTile() {
    return (
      <div className="p-4 pb-0">
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/35 bg-muted/20">
          <Button variant="outlined" onClick={handleAddPropertyClick}>
            <Plus className="size-4" aria-hidden />
            Add Property
          </Button>
        </div>
      </div>
    )
  }

  function handleCreateProperty() {
    if (!name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!location.trim()) {
      setFormError('Location is required')
      return
    }
    setFormError('')
    createMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PropertyCardsSkeleton count={6} />
      </div>
    )
  }

  if (isError) {
    return (
      <Typography className="text-destructive">
        {queryError instanceof Error ? queryError.message : 'Failed to load properties'}
      </Typography>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        {renderAddPropertyButton()}
      </div>

      {!canAddProperty && upgradePlan ? (
        <PlanUpgradeBanner
          requiredPlan={upgradePlan}
          feature={`Adding more than ${propertyLimit} ${propertyLimit === 1 ? 'property' : 'properties'}`}
        />
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {enrichedProperties.map((property) => (
          <Card key={property.id} padding="none" className="overflow-hidden">
            <div className="p-4 pb-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={property.imageUrl ?? PROPERTY_FALLBACK_IMAGE}
                  alt={property.name}
                  className="absolute inset-0 size-full object-cover"
                />
                {property.occupancyRate >= 50 ? (
                  <Badge variant="info" className="absolute left-2 top-2 shadow-sm">
                    Occupied
                  </Badge>
                ) : null}
                {property.nightlyRate ? (
                  <span className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white sm:text-xs">
                    {formatNairaCompact(property.nightlyRate)} /night
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-4">
              <Typography variant="h4" className="min-w-0 truncate">
                {property.name}
              </Typography>
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <Typography variant="caption" className="truncate">
                  {property.location}
                </Typography>
              </div>
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <Calendar className="size-3.5 shrink-0" aria-hidden />
                <Typography variant="caption">
                  Added {format(new Date(property.createdAt), 'MMM d, yyyy')}
                </Typography>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
                <Typography variant="label">{currentMonth} breakdown</Typography>
              </div>
              <BreakdownLine
                icon={Wallet}
                label="Revenue"
                value={formatNairaCompact(property.revenue)}
              />
              <BreakdownLine
                icon={Wrench}
                label="Total maintenance"
                value={formatNairaCompact(property.monthlyMaintenance)}
              />
              <BreakdownLine
                icon={BedDouble}
                label="Occupancy"
                value={`${property.occupancyRate}%`}
                iconClassName="text-secondary"
              />
              <BreakdownLine
                icon={Users}
                label="Staff expenses"
                value={formatNairaCompact(property.staffExpenses)}
              />
            </div>

            <div className="px-4 pb-4">
              <Button
                variant="outlined"
                className="w-full border-secondary text-secondary hover:bg-secondary-50"
                onClick={() => navigate(`/properties/${property.id}`)}
              >
                View Details
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Card>
        ))}
        {renderAddPropertyTile()}
      </div>

      {featureFlags.smartPricing ? (
        <Card padding="md">
          <Typography variant="h4">Optimization Tip</Typography>
          <Typography variant="body" className="mt-2 text-muted-foreground">
            {topOccupancyProperty && topOccupancyProperty.occupancyRate >= 70
              ? `${topOccupancyProperty.name} has a ${topOccupancyProperty.occupancyRate}% occupancy rate. Consider raising your nightly rate to maximize revenue during peak demand.`
              : 'Track occupancy across your portfolio to identify properties where smart pricing could boost revenue.'}
          </Typography>
          <Button className="mt-4">Apply Smart Pricing</Button>
        </Card>
      ) : null}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Property">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          {formError ? (
            <Typography variant="caption" className="text-destructive">
              {formError}
            </Typography>
          ) : null}
          <Button loading={createMutation.isPending} onClick={handleCreateProperty}>
            Save
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
