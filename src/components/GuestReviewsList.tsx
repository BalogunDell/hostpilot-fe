import { Star } from 'lucide-react'
import { Typography } from './Typography'
import { cn } from '../lib/cn'

export interface GuestReview {
  guestName: string
  rating: number
  reviewText: string
  submittedAt?: string
}

interface GuestReviewsListProps {
  reviews: GuestReview[]
  emptyMessage?: string
}

export function GuestReviewsList({
  reviews,
  emptyMessage = 'No reviews are live on your public page yet.',
}: GuestReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Typography variant="body" className="text-muted-foreground">
        {emptyMessage}
      </Typography>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review, index) => (
        <div
          key={`${review.guestName}-${review.submittedAt ?? index}`}
          className="border-t border-border pt-4 first:border-0 first:pt-0"
        >
          <div className="flex items-center justify-between gap-2">
            <Typography variant="label">{review.guestName}</Typography>
            <div className="flex items-center gap-0.5">
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
          <Typography variant="body" className="mt-2 text-muted-foreground">
            {review.reviewText}
          </Typography>
        </div>
      ))}
    </div>
  )
}
