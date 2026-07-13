import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, Input, Typography } from '../components'
import { ApiError, apiRequest } from '../api/client'
import { parseBookingDate } from '../lib/bookingDates'
import { cn } from '../lib/cn'

interface PublicReviewForm {
  state: 'ready' | 'used' | 'expired' | 'cancelled'
  propertyName: string
  guestName: string | null
  checkIn: string | null
  checkOut: string | null
  expiresAt: string | null
  publishesImmediately: boolean
}

function formatReviewStayDate(value: string) {
  const date = parseBookingDate(value)
  return date ? format(date, 'MMMM d, yyyy') : value
}

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} stars`}
          className="rounded p-1 transition-colors hover:bg-accent"
          onClick={() => onChange(star)}
        >
          <Star
            className={cn(
              'size-8',
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewSubmitPage() {
  const { token } = useParams<{ token: string }>()
  const [guestName, setGuestName] = useState('')
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-review', token],
    queryFn: () => apiRequest<PublicReviewForm>(`/public/review/${token}`),
    enabled: Boolean(token),
  })

  useEffect(() => {
    if (data?.guestName) {
      setGuestName((current) => current || data.guestName!)
    }
  }, [data?.guestName])

  const submitMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest<{ submitted: true; status: 'approved' | 'pending' }>(`/public/review/${token}`, {
        method: 'POST',
        body: JSON.stringify({ guestName: name, rating, reviewText }),
      }),
    onSuccess: () => {
      setSubmitted(true)
      setFormError('')
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to submit review'
      setFormError(message)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Typography variant="caption" className="text-muted-foreground">
          Loading review form…
        </Typography>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-lg text-center">
          <Typography variant="h3">Review link not found</Typography>
          <Typography variant="body" className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : 'This link may be invalid.'}
          </Typography>
        </Card>
      </div>
    )
  }

  if (submitted || data.state === 'used') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-lg text-center">
          <Typography variant="h3">
            {submitted ? 'Thank you for your review' : 'Review already submitted'}
          </Typography>
          <Typography variant="body" className="mt-2 text-muted-foreground">
            {submitted
              ? 'Your review is now live on the property page.'
              : 'This review link has already been used.'}
          </Typography>
        </Card>
      </div>
    )
  }

  if (data.state === 'expired') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-lg text-center">
          <Typography variant="h3">Review link expired</Typography>
          <Typography variant="body" className="mt-2 text-muted-foreground">
            This review link has expired. Please contact your host for a new link.
          </Typography>
        </Card>
      </div>
    )
  }

  if (data.state === 'cancelled') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-lg text-center">
          <Typography variant="h3">Review link unavailable</Typography>
          <Typography variant="body" className="mt-2 text-muted-foreground">
            This review link is no longer valid.
          </Typography>
        </Card>
      </div>
    )
  }

  const resolvedGuestName = guestName.trim() || data.guestName?.trim() || ''

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formName = new FormData(event.currentTarget).get('guestName')
    const name =
      (typeof formName === 'string' ? formName : '').trim() || resolvedGuestName

    if (!name) {
      setFormError('Enter your name')
      return
    }
    if (rating < 1) {
      setFormError('Select a star rating')
      return
    }
    if (reviewText.trim().length < 10) {
      setFormError('Write at least 10 characters in your review')
      return
    }
    setFormError('')
    submitMutation.mutate(name)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card padding="lg" className="w-full max-w-lg">
        <Typography variant="h2" className="text-2xl">
          How was your stay?
        </Typography>
        <Typography variant="body" className="mt-3 font-medium text-foreground">
          {data.propertyName}
        </Typography>
        {data.checkIn && data.checkOut ? (
          <Typography variant="body" className="mt-1 text-muted-foreground">
            {formatReviewStayDate(data.checkIn)} — {formatReviewStayDate(data.checkOut)}
          </Typography>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Your name"
            name="guestName"
            autoComplete="name"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
          />

          <div className="flex flex-col gap-2">
            <Typography variant="label">How would you rate your stay?</Typography>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-text" className="text-sm font-medium">
              Tell us about your stay
            </label>
            <textarea
              id="review-text"
              rows={5}
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {formError ? (
            <Typography variant="caption" className="text-destructive">
              {formError}
            </Typography>
          ) : null}

          <Button
            type="submit"
            loading={submitMutation.isPending}
            disabled={!resolvedGuestName || rating < 1 || reviewText.trim().length < 10}
          >
            Submit review
          </Button>
        </form>
      </Card>
    </div>
  )
}
