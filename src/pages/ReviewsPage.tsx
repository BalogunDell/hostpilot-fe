import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Input,
  Typography,
} from '../components'
import { GuestReviewsPreviewDialog } from '../components/GuestReviewsPreviewDialog'
import { useSelectedProperty } from '../context/SelectedPropertyContext'
import { useDashboardPeriod } from '../context/DashboardPeriodContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { cn } from '../lib/cn'

interface Review {
  id: string
  propertyId: string
  guestName: string
  rating: number
  reviewText: string
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
  submittedAt: string
}

export function ReviewsPage() {
  const api = useApi()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { selectedProperty, selectedPropertyId } = useSelectedProperty()
  const { from: monthFrom, to: monthTo } = useDashboardPeriod()
  const { canHideReviews, hasShareablePublicReviewPages } = usePlanFeatures()

  const [from, setFrom] = useState(monthFrom)
  const [to, setTo] = useState(monthTo)
  const [appliedFrom, setAppliedFrom] = useState(monthFrom)
  const [appliedTo, setAppliedTo] = useState(monthTo)
  const [rangeError, setRangeError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setFrom(monthFrom)
    setTo(monthTo)
    setAppliedFrom(monthFrom)
    setAppliedTo(monthTo)
  }, [monthFrom, monthTo, selectedPropertyId])

  const reviewsQuery = useQuery({
    queryKey: ['reviews', selectedPropertyId],
    queryFn: () =>
      api<{ reviews: Review[] }>(`/reviews?propertyId=${selectedPropertyId}`),
    enabled: Boolean(selectedPropertyId),
  })

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: string; status: 'hidden' }) =>
      api<Review>(`/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reviews', selectedPropertyId] })
      showToast('Review hidden from public page')
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Failed to update review', 'error')
    },
  })

  const filteredReviews = useMemo(() => {
    const reviews = reviewsQuery.data?.reviews ?? []
    return reviews.filter((review) => {
      const day = review.submittedAt.slice(0, 10)
      return day >= appliedFrom && day <= appliedTo
    })
  }, [reviewsQuery.data?.reviews, appliedFrom, appliedTo])

  function applyRange() {
    if (!from || !to) {
      setRangeError('Choose both dates.')
      return
    }
    if (from > to) {
      setRangeError('Start date must be on or before the end date.')
      return
    }
    setRangeError('')
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  if (!selectedPropertyId || !selectedProperty) {
    return (
      <div className="flex flex-col gap-3">
        <Typography variant="h2">Reviews</Typography>
        <Typography variant="body" className="text-muted-foreground">
          Select a property from the top bar to view reviews.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2">Reviews</Typography>
        <Typography variant="caption" className="mt-1 block">
          Guest feedback for {selectedProperty.name}
        </Typography>
      </div>

      <Card padding="md" className="flex flex-col gap-4">
        <Typography variant="label">Date range</Typography>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
          <Button className="sm:mt-7" onClick={applyRange}>
            Apply
          </Button>
        </div>
        {rangeError ? (
          <Typography variant="caption" className="text-destructive">
            {rangeError}
          </Typography>
        ) : (
          <Typography variant="caption">
            Showing reviews submitted {appliedFrom} → {appliedTo}
          </Typography>
        )}
      </Card>

      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h4">Guest reviews</Typography>
          <Button
            size="sm"
            variant="outlined"
            className="bg-card"
            onClick={() => setPreviewOpen(true)}
          >
            Preview as guest
          </Button>
        </div>

        {!canHideReviews ? (
          <Typography variant="caption">
            Reviews go live as soon as guests submit them.
            {!hasShareablePublicReviewPages
              ? ' Your public page shows up to 3 reviews.'
              : null}
          </Typography>
        ) : null}

        {reviewsQuery.isLoading ? (
          <Typography variant="caption">Loading reviews…</Typography>
        ) : filteredReviews.length === 0 ? (
          <Typography variant="body" className="text-muted-foreground">
            No reviews in this date range. Create a review link from a completed booking on the
            Bookings page.
          </Typography>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-muted/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Typography variant="label">{review.guestName}</Typography>
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            'size-3.5',
                            index < review.rating
                              ? 'fill-tertiary text-tertiary'
                              : 'text-muted-foreground',
                          )}
                          aria-hidden
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        review.status === 'approved'
                          ? 'success'
                          : review.status === 'pending'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {review.status === 'approved' ? 'Live' : review.status}
                    </Badge>
                    <Typography variant="caption">
                      {new Date(review.submittedAt).toLocaleDateString()}
                    </Typography>
                  </div>
                </div>
                <Typography variant="body" className="mt-2">
                  {review.reviewText}
                </Typography>
                {canHideReviews && review.status !== 'hidden' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    loading={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({ reviewId: review.id, status: 'hidden' })
                    }
                  >
                    Hide from public page
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <GuestReviewsPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        propertyId={selectedProperty.id}
      />
    </div>
  )
}
