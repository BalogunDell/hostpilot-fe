import { useQuery } from '@tanstack/react-query'
import { Card, ListCardSkeleton, PageHeaderSkeleton, StatCard, StatCardsSkeleton, Typography } from '../components'
import { formatNaira } from '../api/client'
import { useApi } from '../hooks/useApi'

export function AnalyticsPage() {
  const api = useApi()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () =>
      api<{
        topProperties: Array<{ name: string; revenue: number }>
        avgNightlyRate: number
        profitMargin: number
      }>('/dashboard/analytics'),
  })

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeaderSkeleton />
        <StatCardsSkeleton count={2} className="sm:grid-cols-2 xl:grid-cols-2" />
        <ListCardSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h2">Analytics</Typography>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Avg. Nightly Rate" value={formatNaira(data.avgNightlyRate)} />
        <StatCard label="Profit Margin" value={`${data.profitMargin}%`} />
      </div>
      <Card padding="md">
        <Typography variant="h4" className="mb-4">Top Earning Properties</Typography>
        <div className="flex flex-col gap-3">
          {data.topProperties.map((property) => (
            <div key={property.name} className="flex items-center justify-between border-b border-border pb-2">
              <Typography variant="label">{property.name}</Typography>
              <Typography>{formatNaira(property.revenue)}</Typography>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
