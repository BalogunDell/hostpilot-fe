import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Card, Image, Skeleton, Typography } from '../components'
import { GuestReviewsList } from '../components/GuestReviewsList'
import { apiRequest, formatNaira } from '../api/client'

interface PublicReview {
  guestName: string
  rating: number
  reviewText: string
  submittedAt: string
}

export function PublicListingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useQuery({
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
  })

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

        {reviews.length > 0 ? (
          <Card padding="lg" className="flex flex-col gap-4">
            <Typography variant="h3">Guest reviews</Typography>
            <GuestReviewsList reviews={reviews} emptyMessage="" />
          </Card>
        ) : null}
      </div>
    </div>
  )
}
