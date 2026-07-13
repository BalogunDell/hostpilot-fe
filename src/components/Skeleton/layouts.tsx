import { Card } from '../Card'
import { cn } from '../../lib/cn'
import { Skeleton } from './Skeleton'

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" variant="text" />
    </div>
  )
}

export function StatCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="flex flex-col gap-3 p-4">
          <Skeleton className="h-3 w-24" variant="text" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-20" variant="text" />
        </Card>
      ))}
    </div>
  )
}

export function TableSkeleton({
  rows = 5,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card',
        className,
      )}
    >
      <div className="hidden border-b border-border bg-muted/40 px-4 py-3 md:block">
        <div className="flex gap-6">
          {['Guest', 'Property', 'Nights', 'Status', 'Source', 'Income'].map((label) => (
            <Skeleton key={label} className="h-4 w-16" variant="text" />
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-0 md:flex-row md:items-center md:gap-6"
          >
            <div className="flex items-center gap-3 md:min-w-[180px]">
              <Skeleton variant="circle" className="size-9 shrink-0" />
              <Skeleton className="h-4 w-28" variant="text" />
            </div>
            <Skeleton className="hidden h-4 w-24 md:block" variant="text" />
            <Skeleton className="hidden h-4 w-16 md:block" variant="text" />
            <Skeleton className="hidden h-6 w-20 rounded-full md:block" />
            <Skeleton className="hidden h-4 w-14 md:block" variant="text" />
            <Skeleton className="hidden h-4 w-20 md:block" variant="text" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PropertyCardsSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} padding="none" className="overflow-hidden">
          <div className="p-4 pb-0">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" variant="text" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-5/6" variant="text" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card padding="md" className={className}>
      <Skeleton className="mb-6 h-6 w-48" />
      <Skeleton className="h-64 w-full rounded-lg sm:h-96" />
    </Card>
  )
}

export function ListCardSkeleton({
  rows = 4,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <Card padding="md" className={className}>
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <Skeleton className="h-4 w-32" variant="text" />
            <Skeleton className="h-4 w-20" variant="text" />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function OverviewPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <div className="lg:hidden">
        <PageHeaderSkeleton />
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        <Card className="flex flex-col gap-3 p-4">
          <Skeleton className="h-3 w-28" variant="text" />
          <Skeleton className="h-8 w-36" />
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-16" variant="text" />
            <Skeleton className="h-7 w-20" />
          </Card>
          <Card className="flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-16" variant="text" />
            <Skeleton className="h-7 w-14" />
          </Card>
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="flex flex-col gap-3 p-6">
            <Skeleton className="h-3 w-24" variant="text" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-3 w-28" variant="text" />
          </Card>
        ))}
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        <Card padding="md" className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" variant="text" />
          <Skeleton className="h-4 w-4/5 max-w-lg" variant="text" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </Card>
        <Card padding="md" className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </Card>
      </div>

      <Card padding="md">
        <Skeleton className="mb-4 h-6 w-44" />
        <TableSkeleton rows={4} />
      </Card>
    </div>
  )
}

export function PropertyDetailPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-56" variant="text" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-5">
          <Card padding="md" className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-72 max-w-full" variant="text" />
              </div>
              <Skeleton className="h-9 w-40 shrink-0 rounded-lg bg-secondary-50" />
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-3 border-b border-border bg-muted/20 px-4 py-3">
                <Skeleton className="h-3 w-20" variant="text" />
                <Skeleton className="h-3 w-24" variant="text" />
              </div>
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton variant="circle" className="size-4" />
                </div>
              ))}
            </div>

            <Skeleton className="h-4 w-36" variant="text" />
          </Card>

          <Card padding="md" className="flex flex-col gap-5">
            <Skeleton className="h-6 w-44" />
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-3 gap-3 border-b border-border bg-muted/20 px-4 py-3">
                <Skeleton className="h-3 w-20" variant="text" />
                <Skeleton className="h-3 w-16" variant="text" />
                <Skeleton className="h-3 w-20 justify-self-end" variant="text" />
              </div>
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <Skeleton className="h-4 w-28" variant="text" />
                  <Skeleton className="h-4 w-20" variant="text" />
                  <Skeleton className="h-4 w-16 justify-self-end" variant="text" />
                </div>
              ))}
              <div className="grid grid-cols-3 items-center gap-3 border-t border-border bg-muted/10 px-4 py-3">
                <Skeleton className="h-4 w-28" variant="text" />
                <span aria-hidden />
                <Skeleton className="h-6 w-20 justify-self-end" />
              </div>
            </div>
            <Skeleton className="h-10 w-40 rounded-md" />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card padding="md" className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" variant="text" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-36" variant="text" />
          </Card>

          <Card padding="md" className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-3 w-36" variant="text" />
          </Card>

          <Card padding="md" className="flex flex-col gap-3">
            <Skeleton className="h-4 w-28" variant="text" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
          </Card>
        </div>
      </div>

      <Card className="flex flex-col gap-4 border-0 bg-primary-900 p-6">
        <Skeleton className="h-6 w-32 bg-primary-700" />
        <Skeleton className="h-4 w-full max-w-lg bg-primary-700" variant="text" />
        <Skeleton className="h-10 w-16 bg-primary-700" />
        <Skeleton className="h-2 w-full rounded-full bg-primary-700" />
      </Card>
    </div>
  )
}

export function DetailPageSkeleton() {
  return <PropertyDetailPageSkeleton />
}

export function PageLoaderSkeleton() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <Skeleton variant="circle" className="size-10" />
      <Skeleton className="h-4 w-32" variant="text" />
    </div>
  )
}
