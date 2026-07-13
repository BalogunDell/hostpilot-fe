import { useQuery } from '@tanstack/react-query'
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, ChartCardSkeleton, PageHeaderSkeleton, Typography } from '../components'
import { formatNaira } from '../api/client'
import { useApi } from '../hooks/useApi'

export function ReportsPage() {
  const api = useApi()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'reports'],
    queryFn: () =>
      api<{ trends: Array<{ month: string; revenue: number; expenses: number }> }>(
        '/dashboard/reports',
      ),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeaderSkeleton />
        <ChartCardSkeleton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h2">Reports</Typography>
      <Card padding="md">
        <CardHeader>
          <CardTitle>Revenue & Expense Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-4 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.trends ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatNaira(Number(v ?? 0))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#1e293b" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
