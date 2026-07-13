import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Star } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, Typography } from './index'
import { GuestReviewsPreviewDialog } from './GuestReviewsPreviewDialog'
import { useApi } from '../hooks/useApi'
import { usePlanFeatures } from '../hooks/usePlanFeatures'
import { useToast } from '../context/ToastContext'
import { cn } from '../lib/cn'

interface Review {
  id: string
  propertyId: string
  propertyName?: string
  guestName: string
  rating: number
  reviewText: string
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
  submittedAt: string
}

interface PropertyReviewsSectionProps {
  propertyId: string
}

export function PropertyReviewsSection({ propertyId }: PropertyReviewsSectionProps) {
  const api = useApi()
  const { showToast } = useToast()
  const { canHideReviews, hasShareablePublicReviewPages } = usePlanFeatures()
  const queryClient = useQueryClient()
  const [previewOpen, setPreviewOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', propertyId],
    queryFn: () =>
      api<{ reviews: Review[] }>(`/reviews?propertyId=${propertyId}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: string; status: 'hidden' }) =>
      api<Review>(`/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] })
      showToast('Review hidden from public page')
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Failed to update review', 'error')
    },
  })

  const reviews = data?.reviews ?? []
  const published = reviews.filter((review) => review.status === 'approved')

  if (isLoading) {
    return (
      <Card padding="md">
        <Typography variant="caption" className="text-muted-foreground">
          Loading reviews…
        </Typography>
      </Card>
    )
  }

  return (
    <>
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h4">Guest reviews</Typography>
          <div className="flex items-center gap-2">
            {published.length > 0 ? (
              <Typography variant="caption" className="text-muted-foreground">
                {published.length} live on public page
              </Typography>
            ) : null}
            <Button size="sm" variant="outlined" className="bg-card" onClick={() => setPreviewOpen(true)}>
              <Eye className="size-4" />
              Preview as guest
            </Button>
          </div>
        </div>

      {!canHideReviews ? (
        <Typography variant="caption" className="text-muted-foreground">
          Reviews go live as soon as guests submit them.
          {!hasShareablePublicReviewPages
            ? ' Your public page shows up to 3 reviews.'
            : null}
        </Typography>
      ) : null}

      {reviews.length === 0 ? (
        <Typography variant="body" className="text-muted-foreground">
          No reviews yet. Create a review link from a completed booking on the Bookings page.
        </Typography>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-border bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Typography variant="label">{review.guestName}</Typography>
                  <div className="mt-1 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'size-4',
                          star <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground',
                        )}
                      />
                    ))}
                  </div>
                </div>
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
              </div>
              <Typography variant="body" className="mt-3 text-muted-foreground">
                {review.reviewText}
              </Typography>
              <Typography variant="caption" className="mt-2 block text-muted-foreground">
                Submitted {new Date(review.submittedAt).toLocaleDateString()}
              </Typography>
              {review.status === 'approved' && canHideReviews ? (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="bg-card"
                    loading={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({ reviewId: review.id, status: 'hidden' })
                    }
                  >
                    Hide from public page
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      </Card>

      <GuestReviewsPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        propertyId={propertyId}
      />
    </>
  )
}
