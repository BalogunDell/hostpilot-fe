import { useMutation } from '@tanstack/react-query'
import { Copy, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog, Select, Typography } from './index'
import { ApiError } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useApi } from '../hooks/useApi'

interface ReviewRequest {
  id: string
  bookingId: string | null
  token: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  reviewUrl: string
  expiresAt: string
}

interface CreateReviewLinkDialogProps {
  open: boolean
  onClose: () => void
  bookingId: string
  guestName: string
  existingRequest?: ReviewRequest | null
  onCreated: (request: ReviewRequest) => void
}

export function CreateReviewLinkDialog({
  open,
  onClose,
  bookingId,
  guestName,
  existingRequest,
  onCreated,
}: CreateReviewLinkDialogProps) {
  const api = useApi()
  const { showToast } = useToast()
  const [expiryDays, setExpiryDays] = useState('14')
  const [createdLink, setCreatedLink] = useState<ReviewRequest | null>(null)
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      api<ReviewRequest>(`/bookings/${bookingId}/review-requests`, {
        method: 'POST',
        body: JSON.stringify({ expiryDays: Number(expiryDays) }),
      }),
    onSuccess: (request) => {
      setCreatedLink(request)
      onCreated(request)
      showToast('Review link created')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to create review link'
      setFormError(message)
    },
  })

  const activeLink =
    createdLink ??
    (existingRequest?.status === 'active' ? existingRequest : null)

  function handleClose() {
    setCreatedLink(null)
    setFormError('')
    setExpiryDays('14')
    onClose()
  }

  async function copyLink() {
    if (!activeLink) return
    try {
      await navigator.clipboard.writeText(activeLink.reviewUrl)
      showToast('Review link copied')
    } catch {
      showToast('Could not copy link', 'error')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Guest review link"
      description={`One-time review link for ${guestName}`}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4 border-t border-border pt-5">
        {activeLink ? (
          <>
            <Typography variant="body" className="text-muted-foreground">
              Share this link with your guest. It can only be used once and expires on{' '}
              {new Date(activeLink.expiresAt).toLocaleDateString()}.
            </Typography>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs break-all">
              {activeLink.reviewUrl}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={copyLink}>
                <Copy className="size-4" />
                Copy link
              </Button>
              <Button variant="outlined" className="flex-1 bg-card" onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <Typography variant="body" className="text-muted-foreground">
              Create a secure one-time link for your guest to submit a review after their stay.
            </Typography>
            <Select
              label="Link expires after"
              value={expiryDays}
              onChange={(event) => setExpiryDays(event.target.value)}
              options={[
                { label: '7 days', value: '7' },
                { label: '14 days', value: '14' },
                { label: '30 days', value: '30' },
              ]}
            />
            {formError ? (
              <Typography variant="caption" className="text-destructive">
                {formError}
              </Typography>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outlined" className="flex-1 bg-card" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                <Link2 className="size-4" />
                Create link
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
