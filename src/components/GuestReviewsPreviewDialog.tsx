import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { Button, Dialog, Typography } from './index'
import { GuestReviewsList } from './GuestReviewsList'
import { useApi } from '../hooks/useApi'

interface GuestReviewsPreviewDialogProps {
  open: boolean
  onClose: () => void
  propertyId: string
}

interface ListingPreview {
  propertyName: string
  location: string
  headline: string
  publicUrl: string
  reviews: Array<{
    guestName: string
    rating: number
    reviewText: string
    submittedAt: string
  }>
}

export function GuestReviewsPreviewDialog({
  open,
  onClose,
  propertyId,
}: GuestReviewsPreviewDialogProps) {
  const api = useApi()

  const { data, isLoading } = useQuery({
    queryKey: ['listing-preview', propertyId],
    queryFn: () =>
      api<{ preview: ListingPreview }>(`/properties/${propertyId}/listing/preview`),
    enabled: open && Boolean(propertyId),
  })

  const preview = data?.preview

  function openPublicPage() {
    if (!preview?.publicUrl) return
    window.open(preview.publicUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Guest view"
      description="This is how reviews appear on your public listing page."
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4 border-t border-border pt-5">
        {isLoading ? (
          <Typography variant="caption" className="text-muted-foreground">
            Loading preview…
          </Typography>
        ) : preview ? (
          <>
            <div>
              <Typography variant="label">{preview.headline}</Typography>
              <Typography variant="caption" className="text-muted-foreground">
                {preview.location}
              </Typography>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <Typography variant="h4" className="mb-4">
                Guest reviews
              </Typography>
              <GuestReviewsList reviews={preview.reviews} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outlined" className="flex-1 bg-card" onClick={onClose}>
                Close
              </Button>
              {preview.publicUrl ? (
                <Button className="flex-1" onClick={openPublicPage}>
                  <ExternalLink className="size-4" />
                  Open public page
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
  )
}
