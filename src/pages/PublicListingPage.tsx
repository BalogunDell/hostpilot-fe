import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Button, Card, Image, Skeleton, Typography } from '../components'
import { GuestReviewsList } from '../components/GuestReviewsList'
import { ApiError, apiRequest, formatNaira } from '../api/client'

interface PublicReview {
  guestName: string
  rating: number
  reviewText: string
  submittedAt: string
}

export function PublicListingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-listing', slug],
    queryFn: () =>
      apiRequest<{
        listing: {
          headline: string | null
          description: string | null
          propertyName: string
          location: string
          nightlyRate: number | null
          imageUrls: string[]
          reviews: PublicReview[]
        }
      }>(`/public/listings/${slug}`),
    enabled: Boolean(slug),
    retry: false,
  })

  if (!slug || isError) {
    const notFound =
      !slug || (error instanceof ApiError && (error.status === 404 || error.code === 'NOT_FOUND'))
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-lg text-center">
          <Typography variant="h3">
            {notFound ? 'Listing not found' : 'Unable to load listing'}
          </Typography>
          <Typography variant="body" className="mt-2 text-muted-foreground">
            {notFound
              ? 'This listing link is invalid or no longer available.'
              : error instanceof Error
                ? error.message
                : 'Something went wrong. Please try again later.'}
          </Typography>
          <div className="mt-6">
            <Link to="/">
              <Button allowWhenReadOnly>Go to HostsLedger</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-svh bg-background p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Card padding="lg" className="flex flex-col gap-4">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/3" variant="text" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-5/6" variant="text" />
          </Card>
        </div>
      </div>
    )
  }

  const listing = data.listing
  const reviews = listing.reviews ?? []

  return (
    <div className="min-h-svh bg-background p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card padding="lg">
          {listing.imageUrls[0] ? (
            <Image src={listing.imageUrls[0]} alt={listing.propertyName} aspectRatio="video" className="mb-6 rounded-xl" />
          ) : null}
          <Typography variant="h1">{listing.headline ?? listing.propertyName}</Typography>
          <Typography variant="caption" className="mb-4 block">{listing.location}</Typography>
          {listing.nightlyRate ? (
            <Typography variant="h3" className="mb-4">{formatNaira(listing.nightlyRate)} / night</Typography>
          ) : null}
          <Typography variant="body">{listing.description}</Typography>
        </Card>

        <Card padding="lg" className="flex flex-col gap-4">
          <Typography variant="h3">Guest reviews</Typography>
          {reviews.length > 0 ? (
            <GuestReviewsList reviews={reviews} emptyMessage="" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Star className="size-6" aria-hidden />
              </div>
              <div>
                <Typography variant="label">No reviews yet</Typography>
                <Typography variant="caption" className="mt-1 block text-muted-foreground">
                  There are no reviews for this property yet.
                </Typography>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
