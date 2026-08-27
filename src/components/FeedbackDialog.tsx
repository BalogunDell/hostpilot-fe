import { useEffect, useState } from 'react'
import { Button, Dialog, Input, Typography } from './index'
import { ApiError, apiRequest } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface FeedbackDialogProps {
  open: boolean
  onClose: () => void
  /** Prefills source field for the ops email. */
  source?: 'marketing' | 'app'
}

export function FeedbackDialog({
  open,
  onClose,
  source = 'app',
}: FeedbackDialogProps) {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setMessage('')
    setError('')
  }, [open, user?.name, user?.email])

  async function handleSubmit() {
    if (name.trim().length < 2) {
      setError('Enter your name.')
      return
    }
    if (!email.trim().includes('@')) {
      setError('Enter a valid email.')
      return
    }
    if (message.trim().length < 10) {
      setError('Please write a bit more detail (at least 10 characters).')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await apiRequest<{ sent: boolean }>('/public/feedback', {
        method: 'POST',
        token: token ?? null,
        logoutOn401: false,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          source,
        }),
      })
      showToast('Thanks — your message was sent')
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not send your message',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={source === 'marketing' ? 'Contact us' : 'Send feedback'}
    >
      <div className="flex flex-col gap-4">
        <Typography variant="body" className="text-muted-foreground">
          {source === 'marketing'
            ? 'Questions about HostsLedger? Send us a message and we will get back to you by email.'
            : 'Share ideas, bugs, or questions. We read every message.'}
        </Typography>
        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            placeholder={
              source === 'marketing'
                ? 'How can we help?'
                : 'What should we know or improve?'
            }
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {error ? (
          <Typography variant="caption" className="text-destructive">
            {error}
          </Typography>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button loading={submitting} onClick={() => void handleSubmit()}>
            Send message
          </Button>
          <Button variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
